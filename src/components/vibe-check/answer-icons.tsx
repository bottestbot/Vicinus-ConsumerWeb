// Per-answer icon for the quiz's big tappable cards (PRD §4 "big tappable
// image/emoji cards, not a cramped multi-select form"). Keyed by the option
// id so it works whether the question text came from the real API or the
// local fallback (src/lib/vibe-check/quiz-fallback.ts) — both use the same ids.
// Falls back to a generic sparkle for any option id not listed (e.g. new
// options added on the backend before this map is updated).
import {
  PartyPopper, Tent, Music, Sofa, Footprints, Bus, Car, Route,
  ShoppingBag, TreePine, Moon, Users, Coffee, Trees, VolumeX,
  Landmark, Building2, MapPin, GraduationCap, Clock, Ban,
  Package, Bike, Plane, Mountain, Home, Laptop, Briefcase, Sparkles,
  type LucideIcon,
} from 'lucide-react'

const ANSWER_ICONS: Record<string, LucideIcon> = {
  'q1-rooftop-patio': PartyPopper,
  'q1-backyard-bonfire': Tent,
  'q1-show-or-gallery': Music,
  'q1-home-by-8': Sofa,

  'q2-walk-or-bike': Footprints,
  'q2-bus-train': Bus,
  'q2-drive': Car,
  'q2-whatever': Route,

  'q3-farmers-market': ShoppingBag,
  'q3-trail-run': TreePine,
  'q3-sleeping-in': Moon,
  'q3-kids-soccer': Users,

  'q4-cafe-chatter': Coffee,
  'q4-birdsong': Trees,
  'q4-bus-beep': Bus,
  'q4-dead-quiet': VolumeX,

  'q5-perfect': Car,
  'q5-dealbreaker': TreePine,
  'q5-dont-care': Sparkles,

  'q6-heritage': Landmark,
  'q6-new-build': Building2,
  'q6-neighbourhood-matters': MapPin,

  'q7-top-priority': GraduationCap,
  'q7-someday': Clock,
  'q7-not-a-factor': Ban,

  'q8-walking-distance': Footprints,
  'q8-quick-drive': Car,
  'q8-delivered': Package,

  'q9-non-negotiable': Bike,
  'q9-nice-to-have': Bike,
  'q9-dont-bike': Ban,

  'q10-flight-out': Plane,
  'q10-weekend-drive': Mountain,
  'q10-never-leave': Home,

  'q11-wfh': Laptop,
  'q11-commute-downtown': Building2,
  'q11-commute-elsewhere': Route,
  'q11-hybrid': Briefcase,
}

export function getAnswerIcon(optionId: string): LucideIcon {
  return ANSWER_ICONS[optionId] ?? Sparkles
}
