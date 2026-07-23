import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../modules/users/users.service'

/**
 * BRIEF-03 — re-runnable backfill that re-derives every user's
 * `UserPreferenceProfile` from their existing `onboardingData` blob.
 *
 * Because BRIEF-02 keeps `onboardingData` authoritative and the profile a pure
 * projection, this is a RE-DERIVE job, not a one-shot migration: safe to run
 * repeatedly, and re-running after any parser change reconciles every profile.
 *
 *   npx ts-node --transpile-only src/scripts/backfill-preference-profiles.ts
 */
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  })
  const prisma = app.get(PrismaService)
  const users = app.get(UsersService)

  const rows = await prisma.user.findMany({
    select: { id: true, onboardingData: true },
  })

  let ok = 0
  let skipped = 0
  for (const row of rows) {
    const blob = (row.onboardingData as Record<string, unknown> | null) ?? null
    if (!blob || Object.keys(blob).length === 0) {
      skipped++
      continue
    }
    const profile = await users.syncPreferenceProfile(row.id, blob)
    if (profile) ok++
    else skipped++
  }

  console.log(
    `Backfill complete: ${rows.length} users scanned, ${ok} profiles derived, ${skipped} skipped (empty/failed).`,
  )
  await app.close()
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
