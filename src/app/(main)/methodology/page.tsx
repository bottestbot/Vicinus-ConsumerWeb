// /methodology — index for the public scoring write-ups (SEO-08, Track E).
//
// Accuracy contract: everything stated here and on the child pages must match
// `api/src/modules/neighbourhoods/scoring/*`. Update both in the same PR.
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Attribution,
  Bullets,
  DataTable,
  PageHeader,
  Section,
} from './_components/prose'

export const metadata: Metadata = {
  title: 'How Vicinus Scores Neighbourhoods — Methodology',
  description:
    'The open methodology behind Vicinus neighbourhood scores: how the livability composite and its walkability, schools, amenities, and transit sub-indices are computed from open data, and what they cannot tell you.',
}

const PAGES = [
  {
    href: '/methodology/livability',
    title: 'Livability score',
    blurb:
      'The 0–100 composite shown on every neighbourhood page: the four sub-indices, the weights, how missing data is handled, and how the “Top X%” percentile is ranked.',
  },
  {
    href: '/methodology/walkability',
    title: 'Walkability score',
    blurb:
      'The largest single input into livability: distance-decayed, variety-weighted access to nine categories of everyday destination, computed from OpenStreetMap.',
  },
]

export default function MethodologyIndexPage() {
  return (
    <article>
      <PageHeader
        eyebrow="Methodology"
        title="How we score neighbourhoods."
        lede={
          <>
            <p>
              Vicinus publishes a 0–100 livability score for every neighbourhood
              it covers, currently across Metro Vancouver. This section documents
              exactly how those numbers are produced, what data goes into them,
              and — just as importantly — what they do not measure.
            </p>
            <p className="mt-4">
              We publish this because a score you cannot audit is a score you
              should not trust when deciding where to live.
            </p>
          </>
        }
        version="Weights version v1"
      />

      <div className="mt-12 space-y-12 text-[15px] leading-relaxed text-[#3A3A3A]">
        <Section id="pages" title="The methodologies">
          <div className="mt-4 space-y-3">
            {PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="block rounded-lg border border-[#E5E3DC] bg-white px-5 py-4 transition-colors hover:border-[#1C3829]"
              >
                <h3 className="font-heading text-lg font-semibold text-[#111111]">
                  {page.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#3A3A3A]">
                  {page.blurb}
                </p>
              </Link>
            ))}
          </div>
        </Section>

        <Section id="principles" title="Principles">
          <p>
            Four commitments constrain every scoring decision we make. They are
            what the detail pages are an expansion of.
          </p>
          <Bullets>
            <li>
              <strong>Deterministic, not generative.</strong> Every score is
              arithmetic over open data. No model and no language model produces
              or adjusts a score. Where AI is involved at all, it re-weights and
              explains scores that were already computed — it never invents one.
            </li>
            <li>
              <strong>Reproducible.</strong> Each score is stored alongside the
              weights version and the dated data snapshot it was computed from,
              so any published number can be recomputed against the exact inputs
              that produced it.
            </li>
            <li>
              <strong>Absent data stays absent.</strong> Where we lack data we
              record nothing, rather than recording a zero. A failed data fetch
              and a genuinely empty neighbourhood are not the same fact, and
              conflating them would quietly distort every comparison.
            </li>
            <li>
              <strong>Access, not quality.</strong> We score what is verifiably
              near a place. We do not rate schools, rank institutions, or infer
              the character of a community from its amenities.
            </li>
          </Bullets>
        </Section>

        <Section id="inputs" title="Where the data comes from">
          <p>
            Every input is open data. No score on Vicinus is derived from
            property listing data, and no listing data is used to rank a
            neighbourhood.
          </p>
          <DataTable
            head={['Input', 'Source', 'Refresh']}
            rows={[
              [
                'Points of interest',
                'OpenStreetMap, via the Overpass API',
                'Quarterly snapshot',
              ],
              [
                'Schools (locations only)',
                'OpenStreetMap',
                'Quarterly snapshot',
              ],
              [
                'Transit service levels',
                'Published agency GTFS feeds',
                'On feed update',
              ],
            ]}
          />
        </Section>

        <Section id="limits" title="What these scores are not">
          <p>
            A livability score is a summary of measurable proximity. It is not a
            recommendation, a valuation input, or a judgement about the people
            who live somewhere.
          </p>
          <Bullets>
            <li>
              It does not measure safety, affordability, air quality, noise,
              community, or how pleasant a place feels to be in.
            </li>
            <li>
              It does not measure school quality. The schools sub-index reflects
              proximity and level coverage only.
            </li>
            <li>
              It is not a property valuation and has no bearing on the price or
              condition of any individual home.
            </li>
            <li>
              It is computed from a single point per neighbourhood, so it
              describes a neighbourhood in aggregate, never a specific address.
            </li>
          </Bullets>
        </Section>
      </div>

      <Attribution includeTransit />
    </article>
  )
}
