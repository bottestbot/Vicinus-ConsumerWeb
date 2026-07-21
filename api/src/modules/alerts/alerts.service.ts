import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AlertType,
  Prisma,
  type OpenHouse,
  type Property,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UsersService,
  DASHBOARD_PROPERTY_SELECT,
  localToDashboardProperty,
} from '../users/users.service';
import { RESIDENTIAL_SUBTYPES } from '../ddf-sync/ddf-query.service';
import { matchesSavedSearch } from './saved-search-matcher.util';

/** Status transitions worth alerting on — DDF's `StandardStatus` is a fairly
 *  noisy open-ended vocabulary; only alert on the ones a buyer actually cares
 *  about, to avoid alert fatigue on incidental upstream churn. */
const ALERT_WORTHY_STATUSES = new Set([
  'Pending',
  'Sold',
  'Conditional',
  'Suspended',
  'Expired',
  'Cancelled',
  'Active',
]);

interface CreateAlertInput {
  userId: string;
  type: AlertType;
  propertyId?: string | null;
  ddfOpenHouseKey?: string | null;
  payload: Record<string, unknown>;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private loggedMissingStructureTypeWarning = false;

  constructor(
    private prisma: PrismaService,
    private users: UsersService,
  ) {}

  // ─── Read/mutate (BE-808/809/810) ────────────────────────────────────────

  async listForUser(
    clerkId: string,
    opts: { type?: AlertType | AlertType[]; page?: number; limit?: number },
  ) {
    const user = await this.users.getMe(clerkId);
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const typeFilter = Array.isArray(opts.type)
      ? opts.type.length > 0
        ? { type: { in: opts.type } }
        : {}
      : opts.type
        ? { type: opts.type }
        : {};
    const where: Prisma.AlertWhereInput = {
      userId: user.id,
      ...typeFilter,
    };

    const [rows, total, unreadCount] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        include: { property: { select: DASHBOARD_PROPERTY_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.alert.count({ where }),
      this.prisma.alert.count({ where: { userId: user.id, readAt: null } }),
    ]);

    const alerts = rows.map((r) => ({
      id: r.id,
      type: r.type,
      propertyId: r.propertyId,
      ddfOpenHouseKey: r.ddfOpenHouseKey,
      payload: r.payload,
      createdAt: r.createdAt,
      readAt: r.readAt,
      property: r.property ? localToDashboardProperty(r.property) : null,
    }));

    return { alerts, total, unreadCount };
  }

  async markRead(clerkId: string, alertId: string) {
    const user = await this.users.getMe(clerkId);
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.userId !== user.id) throw new ForbiddenException();
    if (alert.readAt) return alert;
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { readAt: new Date() },
    });
  }

  /** "Mark all read" clears the list entirely rather than leaving read
   *  alerts around to scroll past — there's no separate archive/read view. */
  /** Opening a notification's detail page counts as consumed — delete it
   *  outright rather than just flagging it read, matching markAllRead. */
  async delete(clerkId: string, alertId: string) {
    const user = await this.users.getMe(clerkId);
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.userId !== user.id) throw new ForbiddenException();
    await this.prisma.alert.delete({ where: { id: alertId } });
  }

  async markAllRead(clerkId: string) {
    const user = await this.users.getMe(clerkId);
    const result = await this.prisma.alert.deleteMany({
      where: { userId: user.id },
    });
    return { count: result.count };
  }

  // ─── Internal — called from the sync pipeline ────────────────────────────

  private async createAlert(input: CreateAlertInput): Promise<void> {
    const data = {
      userId: input.userId,
      type: input.type,
      propertyId: input.propertyId ?? null,
      ddfOpenHouseKey: input.ddfOpenHouseKey ?? null,
      payload: input.payload as Prisma.InputJsonValue,
    };
    try {
      if (input.type === AlertType.OPEN_HOUSE && input.ddfOpenHouseKey) {
        await this.prisma.alert.upsert({
          where: {
            userId_ddfOpenHouseKey: {
              userId: input.userId,
              ddfOpenHouseKey: input.ddfOpenHouseKey,
            },
          },
          create: data,
          update: {},
        });
      } else if (input.propertyId) {
        // The compound unique index accepts NULL propertyId at the DB level
        // (Postgres treats each NULL as distinct), but a null value can't be
        // used to look up "the same" row via equality — so this dedup path
        // only applies when propertyId is known, which holds for every
        // non-OPEN_HOUSE alert type generated by this service.
        await this.prisma.alert.upsert({
          where: {
            userId_propertyId_type: {
              userId: input.userId,
              propertyId: input.propertyId,
              type: input.type,
            },
          },
          create: data,
          update: {},
        });
      } else {
        this.logger.warn(
          `createAlert: no dedup key available for user ${input.userId}, type ${input.type} — skipping`,
        );
      }
    } catch (err) {
      // P2002 (unique constraint) shouldn't happen given the upsert above, but
      // don't let a dedup race take down an entire sync run.
      this.logger.warn(
        `createAlert dedup race for user ${input.userId}, type ${input.type}: ${(err as Error).message}`,
      );
    }
  }

  /** BE-802: diff a newly-synced property against every user's saved search.
   *  DDF mixes commercial/land listings into the same Property resource as
   *  residential stock (see RESIDENTIAL_SUBTYPES) — new-listing alerts are a
   *  buyer-facing feature, so commercial inventory should never fire one. */
  async generateNewListingAlerts(property: Property): Promise<void> {
    if (
      !property.propertySubType ||
      !RESIDENTIAL_SUBTYPES.includes(property.propertySubType)
    ) {
      return;
    }
    const searches = await this.prisma.savedSearch.findMany();
    for (const search of searches) {
      const filters = (search.filters as Record<string, unknown>) ?? {};
      if (filters.structureType && !this.loggedMissingStructureTypeWarning) {
        this.loggedMissingStructureTypeWarning = true;
        this.logger.warn(
          'A SavedSearch uses filters.structureType, which Property does not track — skipping that filter dimension for alert matching (known limitation).',
        );
      }
      if (!matchesSavedSearch(property, filters)) continue;
      await this.createAlert({
        userId: search.userId,
        type: AlertType.NEW_LISTING,
        propertyId: property.id,
        payload: {
          listingKey: property.ddfListingKey,
          address: property.address,
          city: property.city,
          price: property.price,
          matchedSearchId: search.id,
        },
      });
    }
  }

  /** BE-804/805: fires only when the caller has already confirmed a price drop.
   *  Notifies both users interested in this exact listing (saved/visited) and
   *  users whose SavedSearch filters match the property, unioned + deduped. */
  async generatePriceDropAlert(
    property: Property,
    previousPrice: number,
  ): Promise<void> {
    if (property.price === null) return;
    const [interested, searchMatched] = await Promise.all([
      this.interestedUserIds(property.ddfListingKey),
      this.savedSearchMatchedUserIds(property),
    ]);
    const userIds = new Set([...interested, ...searchMatched]);
    for (const userId of userIds) {
      await this.createAlert({
        userId,
        type: AlertType.PRICE_DROP,
        propertyId: property.id,
        payload: {
          listingKey: property.ddfListingKey,
          address: property.address,
          previousPrice,
          newPrice: property.price,
          dropAmount: previousPrice - property.price,
        },
      });
    }
  }

  /** BE-806/807: fires only when the caller has already confirmed a status change.
   *  Notifies both users interested in this exact listing (saved/visited) and
   *  users whose SavedSearch filters match the property, unioned + deduped. */
  async generateStatusChangeAlert(
    property: Property,
    previousStatus: string,
  ): Promise<void> {
    if (!ALERT_WORTHY_STATUSES.has(property.status)) return;
    const [interested, searchMatched] = await Promise.all([
      this.interestedUserIds(property.ddfListingKey),
      this.savedSearchMatchedUserIds(property),
    ]);
    const userIds = new Set([...interested, ...searchMatched]);
    for (const userId of userIds) {
      await this.createAlert({
        userId,
        type: AlertType.STATUS_CHANGE,
        propertyId: property.id,
        payload: {
          listingKey: property.ddfListingKey,
          address: property.address,
          previousStatus,
          newStatus: property.status,
        },
      });
    }
  }

  /** BE-803: matches against both exact SavedProperty saves and SavedSearch filters. */
  async generateOpenHouseAlerts(openHouse: OpenHouse): Promise<void> {
    if (!openHouse.ddfListingKey) return;

    const [savedUserIds, property] = await Promise.all([
      this.prisma.savedProperty
        .findMany({ where: { propertyId: openHouse.ddfListingKey } })
        .then((rows) => rows.map((r) => r.userId)),
      this.prisma.property.findUnique({
        where: { ddfListingKey: openHouse.ddfListingKey },
      }),
    ]);

    const searchUserIds = property
      ? await this.savedSearchMatchedUserIds(property)
      : [];

    const userIds = new Set([...savedUserIds, ...searchUserIds]);
    for (const userId of userIds) {
      await this.createAlert({
        userId,
        type: AlertType.OPEN_HOUSE,
        propertyId: property?.id ?? null,
        ddfOpenHouseKey: openHouse.ddfOpenHouseKey,
        payload: {
          listingKey: openHouse.ddfListingKey,
          address: property?.address ?? null,
          openHouseDate: openHouse.openHouseDate,
          startTime: openHouse.startTime,
          endTime: openHouse.endTime,
        },
      });
    }
  }

  /** Users whose SavedSearch filters match the given property.
   *  NOTE: loads every SavedSearch row and matches in JS — this inherits the
   *  same full-scan cost profile as generateNewListingAlerts/
   *  generateOpenHouseAlerts's saved-search matching; no query-level
   *  pre-filtering (e.g. by city/price range) exists yet for any alert type. */
  private async savedSearchMatchedUserIds(
    property: Property,
  ): Promise<string[]> {
    const searches = await this.prisma.savedSearch.findMany();
    const userIds: string[] = [];
    for (const search of searches) {
      const filters = (search.filters as Record<string, unknown>) ?? {};
      if (matchesSavedSearch(property, filters)) userIds.push(search.userId);
    }
    return userIds;
  }

  /** Users who saved or visited the given DDF ListingKey, deduped. */
  private async interestedUserIds(listingKey: string): Promise<string[]> {
    const [saved, visited] = await Promise.all([
      this.prisma.savedProperty.findMany({ where: { propertyId: listingKey } }),
      this.prisma.visitedProperty.findMany({
        where: { propertyId: listingKey },
      }),
    ]);
    return [
      ...new Set([
        ...saved.map((r) => r.userId),
        ...visited.map((r) => r.userId),
      ]),
    ];
  }
}
