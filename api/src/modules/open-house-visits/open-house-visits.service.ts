import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OpenHouseStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { DdfQueryService } from '../ddf-sync/ddf-query.service';

interface ResolvedSlot {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
}

@Injectable()
export class OpenHouseVisitsService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private ddfQuery: DdfQueryService,
  ) {}

  /** `ddfOpenHouseKey` is the DDF OpenHouseKey. Idempotent — re-adding is a no-op. */
  async addToSchedule(clerkId: string, ddfOpenHouseKey: string) {
    const user = await this.users.getMe(clerkId);

    let propertyId: string | null = null;
    const local = await this.prisma.openHouse.findUnique({
      where: { ddfOpenHouseKey },
    });
    if (local) {
      propertyId = local.ddfListingKey;
    } else {
      // Common path from NearbyOpenHouses, which is live-DDF-backed and may
      // reference an open house that hasn't synced into the local table yet.
      const live = await this.ddfQuery.getOpenHouseByKey(ddfOpenHouseKey);
      propertyId = live?.listingKey ?? null;
    }

    return this.prisma.openHouseVisit.upsert({
      where: { userId_ddfOpenHouseKey: { userId: user.id, ddfOpenHouseKey } },
      create: {
        userId: user.id,
        ddfOpenHouseKey,
        propertyId,
        status: OpenHouseStatus.PLANNED,
      },
      update: {},
    });
  }

  async updateStatus(
    clerkId: string,
    ddfOpenHouseKey: string,
    status: OpenHouseStatus,
  ) {
    const user = await this.users.getMe(clerkId);
    const visit = await this.prisma.openHouseVisit.findUnique({
      where: { userId_ddfOpenHouseKey: { userId: user.id, ddfOpenHouseKey } },
    });
    if (!visit) throw new NotFoundException('Scheduled open house not found');
    if (visit.userId !== user.id) throw new ForbiddenException();
    return this.prisma.openHouseVisit.update({
      where: { id: visit.id },
      data: { status },
    });
  }

  async removeFromSchedule(clerkId: string, ddfOpenHouseKey: string) {
    const user = await this.users.getMe(clerkId);
    await this.prisma.openHouseVisit.deleteMany({
      where: { userId: user.id, ddfOpenHouseKey },
    });
    return { success: true };
  }

  async listForUser(clerkId: string) {
    const user = await this.users.getMe(clerkId);
    const visits = await this.prisma.openHouseVisit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (visits.length === 0) return [];

    const keys = visits.map((v) => v.ddfOpenHouseKey);
    const localSlots = await this.prisma.openHouse.findMany({
      where: { ddfOpenHouseKey: { in: keys } },
    });
    const slotMap = new Map<string, ResolvedSlot>();
    for (const s of localSlots) {
      slotMap.set(s.ddfOpenHouseKey, {
        date: s.openHouseDate
          ? s.openHouseDate.toISOString().slice(0, 10)
          : null,
        startTime: s.startTime,
        endTime: s.endTime,
      });
    }
    // Kept fresh by the 15-min sync cron — a live fallback here should be rare.
    const missingKeys = keys.filter((k) => !slotMap.has(k));
    if (missingKeys.length > 0) {
      const fetched = await Promise.all(
        missingKeys.map((k) => this.ddfQuery.getOpenHouseByKey(k)),
      );
      fetched.forEach((slot, i) => {
        if (slot)
          slotMap.set(missingKeys[i], {
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
      });
    }

    const propertyMap = await this.users.resolveProperties(
      visits.flatMap((v) => (v.propertyId ? [v.propertyId] : [])),
    );

    const enriched = visits.map((v) => {
      const slot = slotMap.get(v.ddfOpenHouseKey) ?? {
        date: null,
        startTime: null,
        endTime: null,
      };
      return {
        id: v.id,
        ddfOpenHouseKey: v.ddfOpenHouseKey,
        status: v.status,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        openHouseDate: slot.date,
        openHouseStartTime: slot.startTime,
        openHouseEndTime: slot.endTime,
        property: v.propertyId ? (propertyMap.get(v.propertyId) ?? null) : null,
      };
    });

    // Group by date (undated slots — e.g. an unresolvable live fallback — sort last).
    const groups = new Map<string, typeof enriched>();
    for (const v of enriched) {
      const key = v.openHouseDate ?? 'unscheduled';
      const arr = groups.get(key) ?? [];
      arr.push(v);
      groups.set(key, arr);
    }

    return [...groups.entries()]
      .sort(([a], [b]) =>
        a === 'unscheduled' ? 1 : b === 'unscheduled' ? -1 : a.localeCompare(b),
      )
      .map(([date, visits]) => ({ date, visits }));
  }
}
