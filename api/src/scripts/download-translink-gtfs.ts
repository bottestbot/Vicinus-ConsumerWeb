import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

// NBHD-19 — fetch TransLink's free static GTFS feed and extract it into
// api/data/translink-gtfs/. TransitService reads that directory. Refresh
// quarterly, alongside the OSM POI snapshot.
//
//   npm run gtfs:translink
//
// The feed is Metro Vancouver only (all 10 launch cities), which is exactly the
// launch scope — the rest of BC would need BC Transit's separate feeds.
const FEED_URL = 'https://gtfs-static.translink.ca/gtfs/google_transit.zip'
const DATA_DIR = join(process.cwd(), 'data')
const ZIP_PATH = join(DATA_DIR, 'translink-gtfs.zip')
const EXTRACT_DIR = join(DATA_DIR, 'translink-gtfs')

function main() {
  mkdirSync(DATA_DIR, { recursive: true })

  console.log(`Downloading TransLink GTFS from ${FEED_URL} ...`)
  // curl/unzip are standard on macOS and Linux CI images; this avoids pulling a
  // zip/http dependency into the app just for a quarterly offline job.
  execFileSync('curl', ['-sSL', '--fail', '-o', ZIP_PATH, FEED_URL], { stdio: 'inherit' })

  if (existsSync(EXTRACT_DIR)) rmSync(EXTRACT_DIR, { recursive: true, force: true })
  mkdirSync(EXTRACT_DIR, { recursive: true })

  console.log(`Extracting to ${EXTRACT_DIR} ...`)
  execFileSync('unzip', ['-o', '-q', ZIP_PATH, '-d', EXTRACT_DIR], { stdio: 'inherit' })
  rmSync(ZIP_PATH, { force: true })

  console.log('Done. Set TRANSLINK_GTFS_PATH=./data/translink-gtfs in api/.env')
}

main()
