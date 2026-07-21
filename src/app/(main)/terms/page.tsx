// Terms of Service — CREA DDF browse-wrap compliance (placeholder copy)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service governing use of the Vicinus real-estate platform and CREA DDF® listing data.',
}

const LAST_UPDATED = 'July 20, 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-24 font-ui">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header */}
        <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-2">
          Legal
        </p>
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-[#111111]">
          Terms of Service.
        </h1>
        <p className="mt-3 text-sm text-[#6B6B6B]">Last updated: {LAST_UPDATED}</p>

        {/* Placeholder disclaimer */}
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Placeholder notice.</strong> This is draft placeholder copy
            intended for review and finalization by qualified legal counsel
            before publication. It does not yet constitute legally binding terms.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-[#3A3A3A]">
          {/* Acceptance / browse-wrap */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              1. Acceptance of these Terms
            </h2>
            <p>
              These Terms of Service (the “Terms”) govern your access to and use
              of the Vicinus website, applications, and related services
              (collectively, the “Platform”). By accessing, browsing, or
              otherwise using the Platform, you acknowledge that you have read,
              understood, and agree to be bound by these Terms and by our{' '}
              <a
                href="/privacy"
                className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
              >
                Privacy Policy
              </a>
              . If you do not agree to these Terms, you must not access or use
              the Platform.
            </p>
          </section>

          {/* Listing data / CREA DDF */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              2. Listing Data and CREA DDF®
            </h2>
            <p>
              Property listing information displayed on the Platform is provided
              in whole or in part by the Canadian Real Estate Association (CREA)
              through its Data Distribution Facility (DDF®). The information is
              provided by members of CREA and is intended for the personal,
              non-commercial use of consumers who may be interested in
              purchasing real estate.
            </p>
            <p className="mt-3">
              The trademarks REALTOR®, REALTORS®, and the REALTOR® logo are
              controlled by CREA and identify real estate professionals who are
              members of CREA. The trademarks MLS®, Multiple Listing Service®,
              and the associated logos are owned by CREA and identify the quality
              of services provided by real estate professionals who are members
              of CREA.
            </p>
          </section>

          {/* Accuracy disclaimer */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              3. Accuracy of Information
            </h2>
            <p>
              Listing and related information is deemed reliable but is{' '}
              <strong>not guaranteed</strong> to be accurate, complete, or
              current by Vicinus or by CREA. You should not rely on the
              information as the sole basis for any purchasing or other decision
              and should independently verify all information, including through
              a licensed real estate professional. Listings may be withdrawn,
              sold, or changed without notice.
            </p>
          </section>

          {/* Acceptable use */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              4. Acceptable Use
            </h2>
            <p>You agree that you will not:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1.5">
              <li>
                use the Platform or any listing data for any commercial purpose,
                or reproduce, redistribute, scrape, or resell any content except
                as expressly permitted;
              </li>
              <li>
                use automated means to access, copy, or index the Platform or
                its data without prior written authorization;
              </li>
              <li>
                interfere with, disrupt, or attempt to gain unauthorized access
                to the Platform, its servers, or related systems; or
              </li>
              <li>
                use the Platform in a manner that violates any applicable law,
                regulation, or the rights of any third party.
              </li>
            </ul>
          </section>

          {/* IP / trademark */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              5. Intellectual Property
            </h2>
            <p>
              The Platform, including its design, editorial content, and
              software, is owned by or licensed to Vicinus and is protected by
              applicable intellectual property laws. Listing data and the
              REALTOR®, MLS®, and related trademarks remain the property of CREA
              and its members. Nothing in these Terms grants you any right,
              title, or interest in any such trademarks or in the underlying
              listing data beyond the limited, personal, non-commercial use
              described herein.
            </p>
          </section>

          {/* Limitation of liability */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              6. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, the Platform and all
              content are provided on an “as is” and “as available” basis without
              warranties of any kind, whether express or implied. Neither Vicinus
              nor CREA shall be liable for any indirect, incidental, special, or
              consequential damages, or for any loss arising from your use of, or
              reliance on, the Platform or any listing information.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              7. Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. Changes take effect
              when posted on this page, and your continued use of the Platform
              after any change constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              8. Contact
            </h2>
            <p>
              Questions about these Terms may be directed to{' '}
              <a
                href="mailto:legal@vicinus.ca"
                className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
              >
                legal@vicinus.ca
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}
