// VIBE-03 — the 9 vibe archetypes, verbatim from PRD §7. Name/tagline/colour/
// icon must stay word-for-word in sync with the PRD table.
//
// `signature` is the PRD's own "dominant signature" column, kept as free text
// since it mixes dimension deltas with flavor conditions (housingEra, WFH)
// that don't share one shape. Archetype selection/tiebreaking against a
// scored quiz result is a separate concern from this module (see PRD §7's
// "ties default to the archetype whose signature most overlaps the matched
// neighbourhood's own top sub-scores").

import { ArchetypeKey, VibeArchetype } from './types'

export const VIBE_ARCHETYPES: Record<ArchetypeKey, VibeArchetype> = {
  'cafe-hopping-urbanite': {
    key: 'cafe-hopping-urbanite',
    name: 'The Café-Hopping Urbanite',
    tagline:
      'You want life happening outside your front door — coffee, dinner, culture, all within stumbling distance.',
    signature: 'Amenities +++, Walkability +++',
    colour: 'Coral',
    icon: 'coffee',
  },
  'transit-maximalist': {
    key: 'transit-maximalist',
    name: 'The Transit Maximalist',
    tagline:
      'Car-free and proud of it — you want a bus or train close enough that the schedule barely matters.',
    signature: 'Transit +++',
    colour: 'Blue',
    icon: 'bus',
  },
  'trailhead-local': {
    key: 'trailhead-local',
    name: 'The Trailhead Local',
    tagline:
      'Your happy place has more trees than traffic. Quiet mornings and trail access beat a nightlife scene every time.',
    signature: 'Green +++, Quiet ++',
    colour: 'Green',
    icon: 'trees',
  },
  'heritage-homebody': {
    key: 'heritage-homebody',
    name: 'The Heritage Homebody',
    tagline:
      'Character over new construction, always. You want creaky floors, mature trees, and a street that feels lived-in.',
    signature: 'housingEra = older, Quiet ++',
    colour: 'Amber',
    icon: 'building-arch',
  },
  'family-basecamp': {
    key: 'family-basecamp',
    name: 'The Family Basecamp',
    tagline:
      "You're planting roots for the long haul — good schools, parks, and a community that knows your kids' names.",
    signature: 'Schools +++, Amenities +',
    colour: 'Teal',
    icon: 'users',
  },
  'new-build-minimalist': {
    key: 'new-build-minimalist',
    name: 'The New-Build Minimalist',
    tagline:
      'Clean lines, modern amenities, low maintenance — you want a neighbourhood as fresh as your finishes.',
    signature: 'housingEra = new, Amenities ++, Walkability +',
    colour: 'Gray',
    icon: 'cube',
  },
  'everything-in-reach-local': {
    key: 'everything-in-reach-local',
    name: 'The Everything-in-Reach Local',
    tagline:
      "Why leave? Groceries, gym, dinner, drinks — it's all inside your own 15-minute world.",
    signature: 'Walkability +++, Amenities +++',
    colour: 'Pink',
    icon: 'shopping-bag',
  },
  'quiet-introvert': {
    key: 'quiet-introvert',
    name: 'The Quiet Introvert',
    tagline:
      'Peace and privacy over foot traffic. You want a street where the loudest thing is the wind.',
    signature:
      'Quiet +++ (low Amenities/Transit); absorbs the WFH signal from Q11 as a chip variant ("home-office-friendly quiet")',
    colour: 'Purple',
    icon: 'moon',
  },
  'downtown-commuter': {
    key: 'downtown-commuter',
    name: 'The Downtown Commuter',
    tagline:
      'You need to get downtown fast and back home even faster — proximity to the core is non-negotiable.',
    signature: 'Transit +++, Walkability +',
    colour: 'Red',
    icon: 'briefcase',
  },
}
