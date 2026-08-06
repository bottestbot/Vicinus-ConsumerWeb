// Shared presentational primitives for the public methodology pages
// (SEO-08, Track E). Private folder — never routed.
//
// These pages are the public, citable write-up of how Vicinus scores
// neighbourhoods. Every figure rendered through them must match the scoring
// code in `api/src/modules/neighbourhoods/scoring/*`. If a constant changes
// there, change it here in the same PR — a methodology page that contradicts
// the implementation is worse than no methodology page.
import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  lede,
  version,
}: {
  eyebrow: string
  title: string
  lede: ReactNode
  version?: string
}) {
  return (
    <header>
      <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-2">
        {eyebrow}
      </p>
      <h1 className="font-heading text-4xl lg:text-5xl font-bold text-[#111111]">
        {title}
      </h1>
      <div className="mt-4 text-[17px] leading-relaxed text-[#3A3A3A]">{lede}</div>
      {version && <p className="mt-4 text-sm text-[#6B6B6B]">{version}</p>}
    </header>
  )
}

export function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">{title}</h2>
      {children}
    </section>
  )
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-heading text-lg font-semibold text-[#111111] mb-2">{title}</h3>
      {children}
    </div>
  )
}

/** A formula or code-shaped block, set apart from the prose. */
export function Formula({ children }: { children: ReactNode }) {
  return (
    // tabIndex={0} makes the scroll region keyboard-reachable (WCAG 2.1.1).
    // Two of these formulas genuinely overflow at 375px, and without it a
    // keyboard-only user cannot scroll to read the rest. `role="region"` plus a
    // label is what stops the tab stop being announced as an unnamed element.
    <pre
      tabIndex={0}
      role="region"
      aria-label="Formula, scrollable"
      className="mt-4 overflow-x-auto rounded-lg border border-[#E5E3DC] bg-white px-4 py-3 text-[13px] leading-relaxed text-[#1C3829] font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C3829]"
    >
      {children}
    </pre>
  )
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border-l-2 border-[#1C3829] bg-[#F2F1EA] px-4 py-3">
      <div className="text-[14px] leading-relaxed text-[#3A3A3A]">{children}</div>
    </div>
  )
}

export function DataTable({
  caption,
  head,
  rows,
}: {
  caption?: string
  head: string[]
  rows: ReactNode[][]
}) {
  return (
    <figure className="mt-4">
      {/* tabIndex={0} — same reason as Formula: a scrollable region that a
          keyboard user cannot reach fails WCAG 2.1.1. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Table, scrollable"
        className="overflow-x-auto rounded-lg border border-[#E5E3DC] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C3829]"
      >
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-[#E5E3DC] bg-[#F7F6F1]">
              {head.map((cell) => (
                <th
                  key={cell}
                  scope="col"
                  className="px-4 py-2.5 text-left font-semibold text-[#111111]"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#EFEDE6] last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 align-top text-[#3A3A3A]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-2 text-[13px] text-[#6B6B6B]">{caption}</figcaption>
      )}
    </figure>
  )
}

export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc pl-6 space-y-2">{children}</ul>
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
    >
      {children}
    </a>
  )
}

/**
 * ODbL requires attribution wherever OpenStreetMap-derived data is surfaced
 * (see `PoiIngestionService.ODBL_ATTRIBUTION`). GTFS feeds are credited to the
 * publishing agency on the same terms.
 */
export function Attribution({ includeTransit = false }: { includeTransit?: boolean }) {
  return (
    <section
      id="attribution"
      aria-label="Data attribution"
      className="mt-14 border-t border-[#E5E3DC] pt-6 text-[13px] leading-relaxed text-[#6B6B6B]"
    >
      <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-[#111111] mb-3">
        Data attribution
      </h2>
      <p>
        Points of interest are derived from OpenStreetMap. Map data ©{' '}
        <TextLink href="https://www.openstreetmap.org/copyright">
          OpenStreetMap contributors
        </TextLink>
        , available under the{' '}
        <TextLink href="https://opendatacommons.org/licenses/odbl/">
          Open Database License (ODbL)
        </TextLink>
        . Data is queried through the{' '}
        <TextLink href="https://overpass-api.de/">Overpass API</TextLink>.
      </p>
      {includeTransit && (
        <p className="mt-3">
          Transit service levels are derived from published GTFS feeds. Metro
          Vancouver service data is © South Coast British Columbia Transportation
          Authority (
          <TextLink href="https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources">
            TransLink
          </TextLink>
          ), used under the terms of its open data licence. Where other agency
          feeds are used, the same attribution applies to the publishing agency.
          Vicinus is not affiliated with, endorsed by, or sponsored by any
          transit agency, and neither agency is responsible for the scores
          derived from its data.
        </p>
      )}
      <p className="mt-3">
        School locations come from OpenStreetMap and reflect where schools are,
        not how they perform. Vicinus does not publish, license, or rank school
        quality data.
      </p>
    </section>
  )
}
