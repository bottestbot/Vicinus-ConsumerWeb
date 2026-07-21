// Privacy Policy — CREA DDF compliance (placeholder copy)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Vicinus collects, uses, and protects your information when you use our real-estate platform.',
}

const LAST_UPDATED = 'July 20, 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-24 font-ui">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header */}
        <p className="text-[11px] font-semibold text-[#1C3829] uppercase tracking-widest mb-2">
          Legal
        </p>
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-[#111111]">
          Privacy Policy.
        </h1>
        <p className="mt-3 text-sm text-[#6B6B6B]">Last updated: {LAST_UPDATED}</p>

        {/* Placeholder disclaimer */}
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Placeholder notice.</strong> This is draft placeholder copy
            intended for review and finalization by qualified legal counsel
            before publication. It does not yet reflect a final, binding privacy
            commitment.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-[#3A3A3A]">
          {/* Overview */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              1. Overview
            </h2>
            <p>
              This Privacy Policy explains how Vicinus (“we”, “us”) collects,
              uses, discloses, and safeguards information when you use the
              Vicinus website and related services (the “Platform”). We are
              committed to handling personal information in accordance with
              applicable Canadian privacy legislation, including the Personal
              Information Protection and Electronic Documents Act (PIPEDA).
            </p>
          </section>

          {/* What we collect */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              2. Information We Collect
            </h2>
            <ul className="mt-1 list-disc pl-6 space-y-1.5">
              <li>
                <strong>Account information</strong> you provide when you sign
                up, such as your name and email address.
              </li>
              <li>
                <strong>Activity information</strong> such as properties you
                view, save, or search for, and preferences used to personalize
                your experience.
              </li>
              <li>
                <strong>Technical information</strong> such as your device type,
                browser, IP address, and interactions with the Platform,
                collected automatically through cookies and similar
                technologies.
              </li>
            </ul>
          </section>

          {/* How we use it */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              3. How We Use Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1.5">
              <li>provide, operate, and maintain the Platform;</li>
              <li>
                personalize listings, recommendations, and search results;
              </li>
              <li>
                communicate with you, including sending alerts or notifications
                you have requested;
              </li>
              <li>
                analyze usage to improve the Platform and its features; and
              </li>
              <li>comply with legal and regulatory obligations.</li>
            </ul>
          </section>

          {/* Cookies / analytics */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              4. Cookies and Analytics
            </h2>
            <p>
              We use cookies and similar technologies to keep you signed in,
              remember your preferences, and understand how the Platform is used.
              We may use privacy-conscious analytics services to measure and
              improve engagement. You can control cookies through your browser
              settings, though disabling them may affect certain features.
            </p>
          </section>

          {/* Third parties */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              5. Third-Party Services and Listing Data
            </h2>
            <p>
              The Platform displays property listing data provided by the
              Canadian Real Estate Association (CREA) through its Data
              Distribution Facility (DDF®). We also rely on third-party service
              providers for hosting, authentication, and analytics. These
              providers process information on our behalf and are expected to
              protect it consistent with this Policy. We do not sell your
              personal information.
            </p>
          </section>

          {/* Retention & security */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              6. Data Retention and Security
            </h2>
            <p>
              We retain personal information only as long as necessary for the
              purposes described in this Policy or as required by law, and we
              apply reasonable administrative, technical, and physical safeguards
              to protect it. No method of transmission or storage is completely
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your rights */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              7. Your Rights
            </h2>
            <p>
              Subject to applicable law, you may request access to, correction
              of, or deletion of your personal information, and you may withdraw
              consent to certain processing. To exercise these rights, contact us
              using the details below.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              8. Changes to this Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Changes take
              effect when posted on this page, and the “Last updated” date above
              will reflect the most recent revision.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              9. Contact
            </h2>
            <p>
              For privacy questions or requests, contact our privacy team at{' '}
              <a
                href="mailto:privacy@vicinus.ca"
                className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
              >
                privacy@vicinus.ca
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}
