import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { join } from 'node:path'

// NBHD-19 — builds an in-memory index of transit stops weighted by weekday
// service level, from an extracted GTFS feed directory. Built once per scoring
// run and reused across every neighbourhood (parsing stop_times.txt is 94 MB /
// millions of rows, far too expensive to repeat per neighbourhood).

export interface WeightedStop {
  lat: number
  lng: number
  /** Peak-weighted weekday trips serving this stop (the transit-value proxy). */
  weight: number
}

export interface TransitStopIndex {
  stops: WeightedStop[]
  /** Total weekday trips across the feed — sanity/logging only. */
  totalTrips: number
}

// Peak windows get double weight: a stop with rush-hour frequency is worth more
// than one with the same daily count spread thin.
const PEAK_HOURS = new Set([6, 7, 8, 15, 16, 17])

/** Minimal CSV line splitter that respects double-quoted fields. */
function splitCsv(line: string): string[] {
  const out: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      out.push(field)
      field = ''
    } else {
      field += c
    }
  }
  out.push(field)
  return out
}

/** Header → column-index map for a GTFS file's first line. */
function headerIndex(line: string): Record<string, number> {
  const idx: Record<string, number> = {}
  splitCsv(line).forEach((h, i) => {
    idx[h.trim().replace(/^﻿/, '')] = i
  })
  return idx
}

/** Parse a small GTFS file fully into rows keyed by header. */
function readCsv(path: string): Record<string, string>[] {
  const text = readFileSync(path, 'utf8')
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return []
  const idx = headerIndex(lines[0])
  const cols = Object.keys(idx)
  return lines.slice(1).map((line) => {
    const fields = splitCsv(line)
    const row: Record<string, string> = {}
    for (const c of cols) row[c] = fields[idx[c]] ?? ''
    return row
  })
}

/** service_ids that run on a representative weekday (Wednesday). */
function weekdayServiceIds(dir: string): Set<string> {
  const set = new Set<string>()
  const calendarPath = join(dir, 'calendar.txt')
  if (existsSync(calendarPath)) {
    for (const row of readCsv(calendarPath)) {
      if (row['wednesday'] === '1') set.add(row['service_id'])
    }
  }
  // calendar_dates exceptions are intentionally ignored for v1 — the base
  // weekday schedule is a fair steady-state proxy for service level.
  return set
}

/** trip_ids operating on a weekday. */
function weekdayTripIds(dir: string, weekdayServices: Set<string>): Set<string> {
  const set = new Set<string>()
  for (const row of readCsv(join(dir, 'trips.txt'))) {
    if (weekdayServices.has(row['service_id'])) set.add(row['trip_id'])
  }
  return set
}

/** stop_id → { lat, lng }. */
function stopCoords(dir: string): Map<string, { lat: number; lng: number }> {
  const map = new Map<string, { lat: number; lng: number }>()
  for (const row of readCsv(join(dir, 'stops.txt'))) {
    const lat = Number(row['stop_lat'])
    const lng = Number(row['stop_lon'])
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.set(row['stop_id'], { lat, lng })
    }
  }
  return map
}

/**
 * Stream stop_times.txt (the only large file) once, accumulating a
 * peak-weighted weekday trip count per stop.
 */
export async function buildTransitIndex(dir: string): Promise<TransitStopIndex> {
  const weekdayServices = weekdayServiceIds(dir)
  const weekdayTrips = weekdayTripIds(dir, weekdayServices)
  const coords = stopCoords(dir)

  const weightByStop = new Map<string, number>()
  let totalTrips = 0

  const stopTimesPath = join(dir, 'stop_times.txt')
  const rl = createInterface({
    input: createReadStream(stopTimesPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  let idx: Record<string, number> | null = null
  for await (const line of rl) {
    if (idx === null) {
      idx = headerIndex(line)
      continue
    }
    if (!line) continue
    const fields = splitCsv(line)
    const tripId = fields[idx['trip_id']]
    if (!weekdayTrips.has(tripId)) continue
    const stopId = fields[idx['stop_id']]
    // arrival_time is "HH:MM:SS" and can exceed 24 for after-midnight service.
    const hour = parseInt(fields[idx['arrival_time']]?.slice(0, 2) ?? '', 10)
    const weight = PEAK_HOURS.has(hour % 24) ? 2 : 1
    weightByStop.set(stopId, (weightByStop.get(stopId) ?? 0) + weight)
    totalTrips += 1
  }

  const stops: WeightedStop[] = []
  for (const [stopId, weight] of weightByStop) {
    const c = coords.get(stopId)
    if (c) stops.push({ lat: c.lat, lng: c.lng, weight })
  }

  return { stops, totalTrips }
}
