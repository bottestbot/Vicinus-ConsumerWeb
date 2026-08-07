// /methodology/livability — public write-up of the livability composite.
//
// Source of truth for every figure on this page:
//   weights + renormalization  api/src/modules/neighbourhoods/scoring/blend.ts
//   orchestration + percentile scoring/livability.service.ts
//   schools + amenities        scoring/schools-amenities.service.ts
//   transit                    scoring/transit.service.ts, scoring/gtfs-transit-index.ts
//   personalization            scoring/personalization.service.ts
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
import JsonLd from '@/components/seo/JsonLd'
import { buildTechArticleSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Livability Score Methodology',
  description:
    'How the Vicinus livability score is calculated: a weighted blend of walkability, schools, amenities, and transit sub-indices computed from OpenStreetMap and agency GTFS data, with its percentile ranking and known limitations.',
}

export default function LivabilityMethodologyPage() {
  // SEO-08 — TechArticle marks this as original methodology rather than
  // marketing prose, which is the distinction answer engines use when
  // deciding what is citable. Dates are omitted deliberately: a wrong
  // datePublished is worse than none (see TechArticleInput).
  const article = buildTechArticleSchema({
    headline: 'Livability Score Methodology',
    description: metadata.description as string,
    url: '/methodology/livability',
    articleSection: 'Methodology',
    keywords: ['livability score', 'walkability', 'neighbourhood scoring', 'OpenStreetMap', 'GTFS', 'Metro Vancouver'],
    proficiencyLevel: 'Expert',
  })

  return (
    <article>
      <JsonLd id="ld-methodology" schema={article} />
      <PageHeader
        eyebrow="Methodology"
        title="Livability score."
        lede={
          <>
            <p>
              The livability score is a single 0–100 number summarising how well
              a neighbourhood supports day-to-day life. It is a weighted blend of
              four sub-indices — walkability, schools, amenities, and transit —
              each computed from open data by fixed arithmetic.
            </p>
            <p className="mt-4">
              There is no model and no language model anywhere in the
              calculation. The same inputs always produce the same score.
            </p>
          </>
        }
        version="Weights version v1"
      />

      <div className="mt-12 space-y-12 text-[15px] leading-relaxed text-[#3A3A3A]">
        <Section id="blend" title="The blend">
          <p>
            Livability is the weighted arithmetic mean of four sub-indices, each
            itself on a 0–100 scale.
          </p>
          <Formula>{`Livability = Walkability × 0.30
           + Schools     × 0.25
           + Amenities   × 0.25
           + Transit     × 0.20`}</Formula>
          <p className="mt-4">
            The weights are an editorial judgement, not a derived result. They
            reflect a simple ordering: the ability to reach everyday life on foot
            matters most, school access and the breadth of nearby amenities
            matter roughly equally, and transit — valuable but a partial
            substitute for walkability — carries the smallest share. Because they
            are a judgement, they are versioned, and the version each score was
            computed under is stored with it.
          </p>

          <SubSection title="When a sub-index is missing">
            <p>
              If a sub-index cannot be computed, it is dropped and the remaining
              weights are renormalized to sum to one. A neighbourhood is never
              penalised for data we do not have.
            </p>
            <p className="mt-3">
              In practice this applies to transit, which is only available where
              an agency GTFS feed covers the area (see{' '}
              <TextLink href="#transit">Transit</TextLink>). Where transit is
              unavailable, the effective weights become:
            </p>
            <DataTable
              head={['Sub-index', 'Nominal weight', 'Effective weight without transit']}
              rows={[
                ['Walkability', '0.30', '0.375'],
                ['Schools', '0.25', '0.3125'],
                ['Amenities', '0.25', '0.3125'],
                ['Transit', '0.20', '—'],
              ]}
            />
            <Callout>
              This is a real limitation, not just a technicality. Two
              neighbourhoods whose scores were computed over different sets of
              sub-indices are not strictly comparable, because one of them was
              measured on three dimensions and the other on four. The stored
              transit sub-score is the way to tell which is which.
            </Callout>
          </SubSection>
        </Section>

        <Section id="sub-indices" title="The four sub-indices">
          <SubSection title="Walkability — weight 0.30">
            <p>
              Distance-decayed, variety-weighted access to nine categories of
              everyday destination, computed from OpenStreetMap points of
              interest within 1.5 km of the neighbourhood centre. It is the
              largest single input into livability and has its own detailed
              write-up.
            </p>
            <p className="mt-3">
              <Link
                href="/methodology/walkability"
                className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
              >
                Read the walkability methodology →
              </Link>
            </p>
          </SubSection>

          <SubSection title="Schools — weight 0.25">
            <p>
              <strong>Locations only. We do not score school quality.</strong>{' '}
              Vicinus does not publish, license, or rank school performance data.
              This sub-index measures access to schools, nothing more.
            </p>
            <Formula>{`Schools = 100 × (0.6 × nearestSchoolAccess + 0.4 × levelCoverage)`}</Formula>
            <Bullets>
              <li>
                <strong>Proximity (60%)</strong> — distance decay to the nearest
                school of any level: full credit at or within 800 m, decaying
                linearly to zero at 3,000 m.
              </li>
              <li>
                <strong>Level coverage (40%)</strong> — how many of elementary,
                middle, and secondary are represented nearby, as a fraction of
                three.
              </li>
            </Bullets>
            <p className="mt-3">
              OpenStreetMap rarely tags a school&rsquo;s level, so level is
              inferred from the school&rsquo;s name — for example
              &ldquo;elementary&rdquo; or &ldquo;primary&rdquo;,
              &ldquo;middle&rdquo; or &ldquo;junior&rdquo;,
              &ldquo;secondary&rdquo; or &ldquo;high school&rdquo;. A school
              whose name does not identify a level counts toward proximity only.
            </p>
            <Callout>
              An earlier version credited unlabelled schools to all three levels.
              Because most OpenStreetMap schools are unlabelled, that handed a
              perfect 100 to any area with a single school of unknown type — it
              was inventing coverage it had no evidence for.
            </Callout>
          </SubSection>

          <SubSection title="Amenities — weight 0.25">
            <p>
              Distance-decayed density of the same nine categories, but with a
              hard cap of three points of interest per category, so variety beats
              raw count. Full credit at or within 400 m, decaying linearly to
              zero at 2,000 m. The result is normalized against every category
              contributing at full strength — nine categories × three each = 27.
            </p>
            <p className="mt-3">
              The tighter distance band and the per-category cap deliberately
              differ from walkability&rsquo;s formulation, so the two sub-indices
              are not measuring the same thing twice.
            </p>
          </SubSection>

          <SubSection title="Transit — weight 0.20">
            <p id="transit" className="scroll-mt-24">
              Transit is computed from published agency GTFS schedules, not from
              a commercial score. Each stop contributes its peak-weighted weekday
              trip count, distance-decayed from the neighbourhood centre.
            </p>
            <Bullets>
              <li>
                <strong>Service level.</strong> Every scheduled weekday stop
                event counts once; events arriving in the morning peak (06:00–08:59)
                or afternoon peak (15:00–17:59) count double, so a stop with
                rush-hour frequency is worth more than one with the same daily
                total spread thin.
              </li>
              <li>
                <strong>Distance.</strong> Stops within 400 m of the centre count
                in full, decaying linearly to zero at 1,200 m. Stops beyond
                1,200 m are ignored. Unlike the other sub-indices, transit
                distance is measured straight-line, without a walking detour
                adjustment.
              </li>
              <li>
                <strong>Normalization.</strong> The decayed, weighted sum is
                scaled against a fixed anchor calibrated to the Metro Vancouver
                distribution and clipped at 100, so frequent-service hubs reach
                the ceiling and low-service edges land near zero.
              </li>
              <li>
                <strong>Weekday baseline.</strong> A representative weekday
                schedule is used. Holiday and seasonal calendar exceptions are
                not modelled, and weekend and late-night service are not scored
                separately.
              </li>
            </Bullets>
            <p className="mt-4">
              {/* {' '} is load-bearing: the text node that follows contains a
                  newline, so JSX trims its leading whitespace and the sentence
                  renders as "Coverage.A transit". */}
              <strong>Coverage.</strong>{' '}
              A transit sub-score is only produced for
              neighbourhoods inside the area an available feed actually covers —
              currently TransLink&rsquo;s Metro Vancouver service area: Vancouver,
              Burnaby, Richmond, Surrey, Coquitlam, Port Moody, Port Coquitlam,
              North Vancouver, West Vancouver, and New Westminster. Outside that
              set, and for any neighbourhood with no stop within range, the
              transit sub-score is recorded as unavailable rather than as zero,
              and its weight is redistributed as described above.
            </p>
          </SubSection>
        </Section>

        <Section id="healthcare" title="Why healthcare is not its own dimension">
          <p>
            Healthcare is not one of the four dimensions blended into the
            composite. There is no healthcare sub-score sitting alongside
            walkability, schools, amenities and transit, and no weight assigned
            to one.
          </p>
          <p className="mt-3">
            It is not absent from the model, though, and it would be misleading
            to imply otherwise. Clinics and pharmacies are one of the nine
            everyday-destination categories counted by the walkability and
            amenities sub-scores, carrying the same weight there as banks or
            entertainment. So healthcare presence does reach the composite —
            just as one ordinary category among nine, rather than as a pillar of
            its own.
          </p>
          <p className="mt-3">
            The reason it is not a pillar: proximity to a hospital is not the
            same as access to healthcare. That depends on catchment, referral
            pathways, specialty and wait times, none of which exist in the
            underlying map data. Living next to a hospital is also frequently a
            negative for noise and traffic. Elevating it to a top-level
            dimension would assert a precision we do not have, so hospitals
            appear on the neighbourhood page as local information rather than as
            a score.
          </p>
        </Section>

        <Section id="percentile" title="The “Top X%” percentile">
          <p>
            A score of 78 means nothing without a reference point, so each
            neighbourhood is also ranked against a pool of peers.
          </p>
          <Formula>{`percentile = 100 × (scored neighbourhoods in the pool at or below this one)
                        ÷ (scored neighbourhoods in the pool)

Top X%     = 100 − percentile`}</Formula>

          <SubSection title="The reference pool is the province">
            <p>
              By default the pool is the neighbourhood&rsquo;s province — so a
              Metro Vancouver neighbourhood is ranked against scored
              neighbourhoods across British Columbia, not against the rest of its
              city or its metro area.
            </p>
            <p className="mt-3">
              City was tried first and is unusable: most cities in the dataset
              contain a single neighbourhood, so every neighbourhood ranked in
              the 100th percentile against itself. Metro area would be the better
              grain — &ldquo;top 10% in Metro Vancouver&rdquo; is more useful to a
              buyer than &ldquo;top 10% in BC&rdquo; — but the underlying data has
              no metro grouping, so province is the coarsest-but-meaningful pool
              available. A neighbourhood can be assigned an explicit reference
              region, which always overrides the province default.
            </p>
            <Callout>
              Two consequences worth being explicit about. A province-wide pool
              includes rural and remote neighbourhoods, which flatters urban
              neighbourhoods relative to a metro-only comparison. And the pool
              contains every scored neighbourhood in the province, including many
              that are not currently browsable on Vicinus.
            </Callout>
          </SubSection>
        </Section>

        <Section id="reproducibility" title="Reproducibility and versioning">
          <p>
            Scoring is an offline batch job. Nothing is scored while you load a
            page — the neighbourhood page reads precomputed values. Each run
            persists its result together with the provenance needed to recompute
            it.
          </p>
          <DataTable
            head={['Stored value', 'Meaning']}
            rows={[
              ['Livability score', 'The 0–100 composite'],
              [
                'Walkability, schools, amenities, transit sub-scores',
                'The four inputs, stored individually so the blend can be audited',
              ],
              ['Livability percentile', 'Rank within the reference region'],
              ['Weights version', 'The weight set used (currently v1)'],
              ['Computed at', 'When the score was produced'],
              ['Reference region', 'The pool the percentile was taken against'],
              [
                'Snapshot version',
                'The dated points-of-interest snapshot the score was built from',
              ],
            ]}
          />
          <p className="mt-4">
            Changing the weights means bumping the weights version. Scores
            computed under different versions are not comparable, and we treat
            them as different measurements rather than silently restating
            history.
          </p>

          <SubSection title="Null, never zero">
            <p>
              A neighbourhood with no points-of-interest snapshot is left
              unscored, not scored zero. A failed data fetch is indistinguishable
              from a genuinely amenity-free area once you write a zero, and a
              single bogus zero drags down the percentile of every other
              neighbourhood in the pool. Unscored neighbourhoods are excluded
              from the ranking pool entirely.
            </p>
            <p className="mt-3">
              One honest exception: this rule operates at the neighbourhood
              level. Within a neighbourhood that does have a snapshot, a
              sub-index with no qualifying points of interest — for example a
              snapshot containing no schools — scores zero rather than being
              treated as missing.
            </p>
          </SubSection>
        </Section>

        <Section id="personalization" title="Personalized match">
          <p>
            Signed-in users who have stated lifestyle priorities also see a match
            percentage alongside the neutral livability score. This is the same
            four sub-indices re-blended with weights derived from those
            priorities: each stated priority maps to a dimension, earlier
            priorities carry more weight than later ones, and every dimension
            keeps a small baseline weight so nothing drops out entirely.
          </p>
          <p className="mt-3">
            The reason and caution labels shown next to it are templated directly
            from the sub-scores against fixed thresholds — a strong dimension
            produces a positive label, a weak one produces at most a single
            caution, preferring a dimension the user actually said they cared
            about. Nothing here is generated text.
          </p>
          <p className="mt-3">
            Users with no stated priorities see the default weights and are not
            shown a personalized match. Personalization changes only how the
            sub-indices are weighted for one reader — it never changes the
            underlying sub-scores or the public livability score.
          </p>
        </Section>

        <Section id="limitations" title="Known limitations">
          <p>
            These are accepted trade-offs in the current version, stated so you
            can weigh the score accordingly.
          </p>
          <Bullets>
            <li>
              <strong>Transit coverage is partial.</strong> Outside the area
              covered by an available agency feed, transit is not scored at all
              and its weight is redistributed across the other three
              sub-indices.
            </li>
            <li>
              <strong>The percentile pool is the province.</strong> Not the city,
              not the metro area, and it includes neighbourhoods that are not
              browsable on the site.
            </li>
            <li>
              <strong>One point per neighbourhood.</strong> Scores are computed
              from a single centroid rather than a grid of sample points, so
              large or irregularly shaped neighbourhoods are represented by their
              centre only. A score never describes a specific address.
            </li>
            <li>
              <strong>Distances are approximated, not routed.</strong> The
              walkability, schools, and amenities sub-indices use straight-line
              distance with a fixed detour factor, which ignores rivers,
              highways, rail lines, and dead ends.
            </li>
            <li>
              <strong>Map data completeness varies.</strong> OpenStreetMap
              coverage is excellent in dense urban areas and thinner elsewhere,
              which can understate smaller communities.
            </li>
            <li>
              <strong>Schools measure access, not quality</strong>, and level
              coverage depends on how schools happen to be named in the map data.
            </li>
            <li>
              <strong>The weights are a judgement.</strong> A different
              defensible weighting would produce different rankings. That is why
              the sub-scores are published individually alongside the composite.
            </li>
            <li>
              <strong>Not measured at all:</strong> safety, affordability, noise,
              air quality, commute time to a specific workplace, and everything
              about a place that is not a mappable destination or a scheduled
              transit trip.
            </li>
          </Bullets>
        </Section>
      </div>

      <Attribution includeTransit />
    </article>
  )
}
