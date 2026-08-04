// /methodology/walkability — public write-up of the walkability sub-index.
//
// Source of truth for every figure on this page:
//   weights, caps, anchor  api/src/modules/neighbourhoods/scoring/walkability.service.ts
//   distance + decay       scoring/geo.ts
//   category mapping       api/src/modules/neighbourhoods/poi-ingestion.service.ts
// Change a constant there and you must change it here in the same PR.
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Attribution,
  Bullets,
  Callout,
  DataTable,
  Formula,
  PageHeader,
  Section,
  SubSection,
  TextLink,
} from '../_components/prose'

export const metadata: Metadata = {
  title: 'Walkability Score Methodology',
  description:
    'How the Vicinus walkability score is calculated from OpenStreetMap data: nine categories of everyday destination, distance decay, diminishing returns, category weights, and the limitations of a straight-line model.',
}

const CATEGORIES: [string, string, string][] = [
  ['Grocery', 'Supermarkets and convenience stores', '1.5'],
  ['Restaurants', 'Restaurants', '1.2'],
  ['Coffee', 'Cafés', '1.0'],
  ['Parks', 'Parks and playgrounds', '1.0'],
  ['Schools', 'Schools', '1.0'],
  ['Errands', 'Any other retail shop', '1.0'],
  ['Banks', 'Banks', '0.8'],
  ['Healthcare', 'Hospitals and pharmacies', '0.8'],
  ['Entertainment', 'Bars', '0.8'],
]

export default function WalkabilityMethodologyPage() {
  return (
    <article>
      <PageHeader
        eyebrow="Methodology"
        title="Walkability score."
        lede={
          <>
            <p>
              The walkability score measures how much of daily life is reachable
              on foot from a neighbourhood&rsquo;s centre: how many everyday
              destinations are nearby, how close they are, and whether they cover
              a variety of needs rather than ten of the same thing.
            </p>
            <p className="mt-4">
              It is <strong>not</strong> a measure of how pleasant the walk is.
              Sidewalk quality, traffic, crossings, and terrain are not modelled
              — see <TextLink href="#limitations">limitations</TextLink>.
            </p>
          </>
        }
        version="Weights version v1"
      />

      <div className="mt-12 space-y-12 text-[15px] leading-relaxed text-[#3A3A3A]">
        <Section id="data" title="Data source">
          <p>
            Every destination comes from <strong>OpenStreetMap</strong>, queried
            through the{' '}
            <TextLink href="https://overpass-api.de/">Overpass API</TextLink>.
            Points of interest are pulled within a 1,500 m radius of the
            neighbourhood centre and stored locally with a dated quarterly
            snapshot tag, so a score can always be recomputed against the exact
            data that produced it.
          </p>
          <p className="mt-3">
            We build this from open data rather than licensing a commercial
            walkability score. That means the calculation can be published in
            full, which is the entire point of this page.
          </p>
          <Callout>
            Map data © OpenStreetMap contributors, available under the{' '}
            <TextLink href="https://www.openstreetmap.org/copyright">
              Open Database License (ODbL)
            </TextLink>
            .
          </Callout>

          <SubSection title="The nine categories">
            <p>
              Raw map tags are mapped into nine categories of everyday
              destination. Anything that does not fall into one of them is
              ignored, and transit stops are stored separately so they can never
              influence a walkability score — transit has its own sub-index.
            </p>
            <DataTable
              caption="Category weights are relative, not percentages; they sum to 9.1."
              head={['Category', 'What it covers', 'Weight']}
              rows={CATEGORIES.map(([name, covers, weight]) => [
                <strong key={name}>{name}</strong>,
                covers,
                weight,
              ])}
            />
            <p className="mt-4">
              Groceries carry the highest weight because grocery shopping is the
              most frequent non-work trip most households make. Bars, banks, and
              healthcare carry the lowest, because their visit frequency is far
              lower even though their presence still signals a functioning local
              high street.
            </p>
          </SubSection>
        </Section>

        <Section id="calculation" title="How the score is computed">
          <SubSection title="1. Walking distance">
            <p>
              Straight-line (great-circle) distance from the neighbourhood
              centre, multiplied by a <strong>1.4 detour factor</strong> — a real
              pedestrian route is always longer than the crow flies.
            </p>
            <p className="mt-3">
              This is a deliberate simplification. True network distance over the
              pedestrian street graph is a future improvement, and the gap
              between the two is the single largest known source of error in this
              score.
            </p>
          </SubSection>

          <SubSection title="2. Distance decay">
            <p>
              Each destination earns credit between 0 and 1 based on how far away
              it is:
            </p>
            <Bullets>
              <li>
                <strong>400 m or less</strong> — full credit. Roughly a
                five-minute walk.
              </li>
              <li>
                <strong>400 m to 2,400 m</strong> — credit decays linearly from
                1 to 0.
              </li>
              <li>
                <strong>Beyond 2,400 m</strong> — no credit.
              </li>
            </Bullets>
          </SubSection>

          <SubSection title="3. Diminishing returns">
            <p>
              Decayed credit is summed per category, capped at 10, and passed
              through a logarithm. The first grocery store matters enormously;
              the eighth adds very little. Without this, one dense commercial
              strip would swamp every other signal in the score.
            </p>
            <Formula>{`categoryValue = log(1 + min(decayedCount, 10)) × categoryWeight`}</Formula>
          </SubSection>

          <SubSection title="4. Normalization to 0–100">
            <p>
              Category values are summed and divided by the maximum total any
              neighbourhood could attain — every one of the nine categories
              saturated at the cap.
            </p>
            <Formula>{`score = 100 × weightedTotal ÷ maxAttainable

maxAttainable = log(1 + 10) × 9.1 ≈ 21.82`}</Formula>
            <p className="mt-4">
              The anchor is <em>derived</em> from the ceiling rather than
              hand-tuned. A walkability score is therefore &ldquo;what fraction of
              the best possible outcome this neighbourhood achieves&rdquo;, and
              changing the weights or the cap cannot silently re-scale the index
              underneath it.
            </p>
          </SubSection>
        </Section>

        <Section id="calibration" title="Calibration">
          <p>
            The normalization anchor was originally a fixed guess, calibrated
            against a small synthetic test fixture of about a dozen destinations.
            Real map data returns vastly more than that — a dense Vancouver
            neighbourhood can return over a thousand points of interest within
            1.5 km — so weighted totals blew straight past the guessed anchor and
            clamped.
          </p>
          <p className="mt-3">
            Measured against a sample of real British Columbia neighbourhoods, a
            majority scored exactly 100 under the guessed anchor, which also made
            the livability percentile meaningless because everything tied.
            Deriving the anchor from the true ceiling instead produced a usable
            spread across the sample, from the low tens in remote communities to
            100 in the densest urban cores, with only the very densest reaching
            the ceiling.
          </p>
          <Callout>
            The lesson worth carrying forward: a constant calibrated on synthetic
            data will not survive contact with real density. Anyone re-tuning the
            category weights or the per-category cap should re-run the comparison
            across real neighbourhoods before shipping.
          </Callout>
        </Section>

        <Section id="limitations" title="Known limitations">
          <p>Accepted trade-offs in the current version:</p>
          <Bullets>
            <li>
              <strong>Straight-line distance × 1.4, not network routing.</strong>{' '}
              Ignores rivers, highways, rail lines, and cul-de-sacs. A
              neighbourhood separated from its amenities by an uncrossable
              barrier scores too high.
            </li>
            <li>
              <strong>No pedestrian-friendliness adjustment.</strong> Intersection
              density and block length are not implemented, so sidewalk quality,
              traffic volume, and crossing frequency do not affect the score at
              all.
            </li>
            <li>
              <strong>One sample point, not a grid.</strong> The score is measured
              from a single centroid rather than the median of grid-sampled
              points, so large or irregular neighbourhoods are represented by
              their centre only — and no score describes a specific address.
            </li>
            <li>
              <strong>Map completeness varies.</strong> OpenStreetMap coverage is
              excellent in urban areas and thinner in rural ones, which can
              understate small towns.
            </li>
            <li>
              <strong>Category caps are uniform.</strong> Every category caps at
              the same decayed count, regardless of how many of that destination
              type a neighbourhood realistically needs.
            </li>
            <li>
              <strong>Destination presence is not quality.</strong> The score
              counts that a grocery store exists nearby, not whether it is good,
              affordable, or open when you need it.
            </li>
          </Bullets>
        </Section>

        <Section id="composite" title="How this feeds the livability score">
          <p>
            Walkability is the largest single input into the Vicinus livability
            composite, carrying a weight of 0.30 alongside schools, amenities,
            and transit.
          </p>
          <p className="mt-3">
            <Link
              href="/methodology/livability"
              className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
            >
              Read the livability methodology →
            </Link>
          </p>
        </Section>
      </div>

      <Attribution />
    </article>
  )
}
