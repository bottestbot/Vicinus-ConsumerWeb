// VIBE-02 — the 11-question quiz bank, verbatim from PRD §5. Question and
// answer text must stay word-for-word in sync with the PRD table; don't
// paraphrase when editing copy here.
//
// Delta scale: 1 = "+", 2 = "++", 3 = "+++", matching the PRD's own notation.
// A bare "flavor: X" note (no +/++/+++ given in the PRD, e.g. housing era,
// airport) is scored as a flat 2 — a moderate, single-purpose signal.
//
// PRD §5 prose calls Q5/Q6/Q10 "pure flavor/tiebreaker" questions that "don't
// touch the core blend," but the PRD's own table gives Q10's third option
// explicit core deltas (Amenities +++, Walkability ++). Per the parent task's
// instruction to follow "the exact mapping per answer" from the table, this
// file encodes the table literally, including that Q10 answer's core deltas.

import { QuizQuestion } from './types'

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    text: "Friday night, you're...",
    options: [
      {
        id: 'q1-rooftop-patio',
        text: 'Rooftop patio, new restaurant just opened',
        dimensionDeltas: { amenities: 2 },
      },
      {
        id: 'q1-backyard-bonfire',
        text: 'Backyard bonfire, string lights, maybe a neighbour drops by',
        flavorDeltas: { quiet: 2, green: 1 },
      },
      {
        id: 'q1-show-or-gallery',
        text: 'Catching a show or gallery opening',
        dimensionDeltas: { amenities: 2, transit: 1 },
      },
      {
        id: 'q1-home-by-8',
        text: 'Home by 8, and thrilled about it',
        flavorDeltas: { quiet: 3 },
      },
    ],
  },
  {
    id: 'q2',
    text: 'How do you actually get around?',
    options: [
      {
        id: 'q2-walk-or-bike',
        text: 'Walk or bike almost everywhere',
        dimensionDeltas: { walkability: 3 },
        flavorDeltas: { bikeLane: 2 },
      },
      {
        id: 'q2-bus-train',
        text: "Bus/train, don't own a car",
        dimensionDeltas: { transit: 3 },
      },
      {
        id: 'q2-drive',
        text: 'Drive, and honestly prefer it',
      },
      {
        id: 'q2-whatever',
        text: 'Whatever the day calls for',
        dimensionDeltas: { walkability: 1, schools: 1, amenities: 1, transit: 1 },
      },
    ],
  },
  {
    id: 'q3',
    text: 'Sunday morning looks like?',
    options: [
      {
        id: 'q3-farmers-market',
        text: 'Farmers market, then a coffee crawl',
        dimensionDeltas: { amenities: 2, walkability: 1 },
      },
      {
        id: 'q3-trail-run',
        text: 'Trail run or a walk in the woods',
        flavorDeltas: { green: 2 },
      },
      {
        id: 'q3-sleeping-in',
        text: 'Sleeping in, zero plans, zero people',
        flavorDeltas: { quiet: 2 },
      },
      {
        id: 'q3-kids-soccer',
        text: "Kid's soccer game, then brunch with the family",
        dimensionDeltas: { schools: 2, amenities: 1 },
      },
    ],
  },
  {
    id: 'q4',
    text: 'Pick a soundtrack for your street',
    options: [
      {
        id: 'q4-cafe-chatter',
        text: 'Café chatter and clinking cups',
        dimensionDeltas: { amenities: 2 },
      },
      {
        id: 'q4-birdsong',
        text: 'Birdsong and rustling leaves',
        flavorDeltas: { green: 3 },
      },
      {
        id: 'q4-bus-beep',
        text: 'The friendly beep of a bus pulling up right on time',
        dimensionDeltas: { transit: 1 },
      },
      {
        id: 'q4-dead-quiet',
        text: 'Dead quiet — you can hear yourself think',
        flavorDeltas: { quiet: 3 },
      },
    ],
  },
  {
    id: 'q5',
    text: 'A highway on-ramp two minutes from home is...',
    options: [
      {
        id: 'q5-perfect',
        text: 'Perfect, I drive everywhere anyway',
      },
      {
        id: 'q5-dealbreaker',
        text: 'A dealbreaker — I want green space, not overpasses',
        flavorDeltas: { green: 2, quiet: 1 },
      },
      {
        id: 'q5-dont-care',
        text: "Don't really care",
      },
    ],
  },
  {
    id: 'q6',
    text: 'Your dream home is...',
    options: [
      {
        id: 'q6-heritage',
        text: 'A character heritage house with creaky charm',
        flavorDeltas: { housingEraOlder: 2 },
      },
      {
        id: 'q6-new-build',
        text: 'A sleek new-build condo or townhome',
        flavorDeltas: { housingEraNewer: 2 },
      },
      {
        id: 'q6-neighbourhood-matters',
        text: 'Honestly, the neighbourhood matters way more than the house',
      },
    ],
  },
  {
    id: 'q7',
    text: "How much do schools factor into where you'd live?",
    options: [
      {
        id: 'q7-top-priority',
        text: 'A ton — top priority',
        dimensionDeltas: { schools: 3 },
      },
      {
        id: 'q7-someday',
        text: 'Someday, thinking ahead',
        dimensionDeltas: { schools: 1 },
      },
      {
        id: 'q7-not-a-factor',
        text: 'Not really a factor for me',
      },
    ],
  },
  {
    id: 'q8',
    text: 'Errand day means...',
    options: [
      {
        id: 'q8-walking-distance',
        text: "Everything's in walking distance, it's a 15-minute neighbourhood",
        dimensionDeltas: { walkability: 3, amenities: 2 },
      },
      {
        id: 'q8-quick-drive',
        text: 'Quick drive to grab what I need',
      },
      {
        id: 'q8-delivered',
        text: 'Groceries delivered — I rarely leave the house',
        flavorDeltas: { quiet: 1 },
      },
    ],
  },
  {
    id: 'q9',
    text: 'Bike lanes on your street:',
    options: [
      {
        id: 'q9-non-negotiable',
        text: 'Non-negotiable, I ride everywhere',
        dimensionDeltas: { walkability: 1 },
        flavorDeltas: { bikeLane: 3 },
      },
      {
        id: 'q9-nice-to-have',
        text: 'Nice to have',
        flavorDeltas: { bikeLane: 1 },
      },
      {
        id: 'q9-dont-bike',
        text: "Don't bike, don't care",
      },
    ],
  },
  {
    id: 'q10',
    text: 'Your ideal "close to home" escape',
    options: [
      {
        id: 'q10-flight-out',
        text: "A 20-minute flight out of town — hate wasting time getting to the airport",
        flavorDeltas: { airport: 2 },
      },
      {
        id: 'q10-weekend-drive',
        text: 'A weekend drive up the coast or into the mountains',
        flavorDeltas: { green: 1 },
      },
      {
        id: 'q10-never-leave',
        text: 'Honestly I never want to leave my neighbourhood — it has everything',
        dimensionDeltas: { amenities: 3, walkability: 2 },
      },
    ],
  },
  {
    id: 'q11',
    text: 'Your workday looks like...',
    options: [
      {
        id: 'q11-wfh',
        text: 'Work from home, rarely commute',
        flavorDeltas: { quiet: 2, green: 1 },
      },
      {
        id: 'q11-commute-downtown',
        text: 'Commute downtown to an office',
        dimensionDeltas: { transit: 3, walkability: 1 },
      },
      {
        id: 'q11-commute-elsewhere',
        text: 'Commute somewhere else in the region',
      },
      {
        id: 'q11-hybrid',
        text: 'Hybrid — a couple days in, a couple from home',
        dimensionDeltas: { transit: 1 },
        flavorDeltas: { quiet: 1 },
      },
    ],
  },
]
