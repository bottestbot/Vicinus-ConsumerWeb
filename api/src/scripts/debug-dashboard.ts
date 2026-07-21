import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { UsersService } from '../modules/users/users.service'

// One-off diagnostic: exercises the exact saveProperty / trackVisited /
// getDashboard code path the HTTP API uses, without needing a browser
// session or Clerk auth. Run with a real clerkId + a ddfListingKey that
// exists in the local Property table.
async function main() {
  const clerkId = process.argv[2]
  const listingKey = process.argv[3]
  if (!clerkId || !listingKey) {
    console.error('Usage: ts-node debug-dashboard.ts <clerkId> <ddfListingKey>')
    process.exit(1)
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  })
  const users = app.get(UsersService)

  console.log(`\n=== saveProperty(${clerkId}, ${listingKey}) ===`)
  const saved = await users.saveProperty(clerkId, listingKey)
  console.log(saved)

  console.log(`\n=== trackVisited(${clerkId}, ${listingKey}) ===`)
  const visited = await users.trackVisited(clerkId, listingKey)
  console.log(visited)

  console.log(`\n=== getSavedProperties(${clerkId}) ===`)
  console.log(JSON.stringify(await users.getSavedProperties(clerkId), null, 2))

  console.log(`\n=== getVisitedProperties(${clerkId}) ===`)
  console.log(JSON.stringify(await users.getVisitedProperties(clerkId), null, 2))

  console.log(`\n=== getDashboard(${clerkId}) ===`)
  const dashboard = await users.getDashboard(clerkId)
  console.log(JSON.stringify({ ...dashboard, editorial: `[${dashboard.editorial.length} items]` }, null, 2))

  await app.close()
}

main().catch((err) => {
  console.error('Debug script failed:', err)
  process.exit(1)
})
