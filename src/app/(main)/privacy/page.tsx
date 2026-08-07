// Privacy Policy — PIPEDA / BC PIPA disclosures + CREA DDF compliance.
//
// This page must describe what the Platform ACTUALLY does. When a data flow
// changes, update the matching section here in the same PR:
//   - Clerk sign-in / session cookies          → §4, §6
//   - Onboarding wizard fields                 → §2(b)  (UserPreferenceProfile)
//   - "Email REALTOR®" inquiry                 → §2(a), §6  (lead module)
//   - Sell / valuation flow                    → §2(a)    (sell module)
//   - CREA LogEvents view/Click/email_realtor  → §5       (analytics module)
//   - vic_vid visitor cookie                   → §4       (visitor-id.util.ts)
//   - Map-view reverse geocoding               → §2(d)    (MapView)
//     (device geolocation was removed — we no longer prompt for location)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Vicinus collects, uses, shares, and protects your personal information when you use our real-estate platform.',
}

const LAST_UPDATED = 'July 29, 2026'

// Set once the registered business address is confirmed; PIPEDA expects a
// physical contact point for the accountable individual. Rendered in §15 only
// when non-null, so the page never ships a bracketed placeholder.
const BUSINESS_ADDRESS: string | null = null

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

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-[#3A3A3A]">
          {/* 1. Overview */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              1. Who We Are and What This Policy Covers
            </h2>
            <p>
              This Privacy Policy explains how VicinityProptech Inc., operating
              as Vicinus (“we”, “us”, “our”), collects, uses, discloses, and
              safeguards personal information when you use the Vicinus website
              and related services (the “Platform”).
              It applies to visitors, registered users, sellers who request a
              valuation, and real estate professionals who join our waitlist.
            </p>
            <p className="mt-3">
              We handle personal information in accordance with applicable
              Canadian privacy legislation, including the federal{' '}
              <em>Personal Information Protection and Electronic Documents Act</em>{' '}
              (PIPEDA) and, where it applies, British Columbia’s{' '}
              <em>Personal Information Protection Act</em> (PIPA). Your use of
              the Platform is also governed by our{' '}
              <a
                href="/terms"
                className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
              >
                Terms of Service
              </a>
              .
            </p>
            <p className="mt-3">
              We have designated a Privacy Officer who is accountable for our
              compliance with this Policy. Their contact details are in section
              15.
            </p>
          </section>

          {/* 2. What we collect */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              2. Information We Collect
            </h2>

            <h3 className="font-heading text-lg font-semibold text-[#111111] mt-5 mb-2">
              (a) Information you give us
            </h3>
            <ul className="mt-1 list-disc pl-6 space-y-1.5">
              <li>
                <strong>Account information.</strong> When you sign up we
                collect your name, email address, and profile image (if you sign
                in with Google). Sign-in is handled by our authentication
                provider, Clerk — see section 6. We do not store your password.
              </li>
              <li>
                <strong>Onboarding preferences.</strong> If you complete the
                onboarding questions, we collect your goal (buy, sell, rent, or
                exploring), timeline, home type, budget range, minimum bedrooms,
                mortgage status, whether you are already working with a
                REALTOR®, your preferred neighbourhoods, and your lifestyle
                priorities (for example schools, transit, or walkability).
              </li>
              <li>
                <strong>Inquiries to a REALTOR®.</strong> When you use “Email
                REALTOR®” on a listing, we collect your name, email address,
                phone number (optional, or required if you ask to be contacted
                by phone or text), preferred contact method, and your message,
                together with the listing the inquiry is about.
              </li>
              <li>
                <strong>Seller and valuation information.</strong> If you use
                the sell or valuation flow, we collect the property address you
                enter, your answers about your selling priority, biggest hurdle,
                and advisory preference, and — if you choose to provide them —
                your first name, last name, email address, and phone number. We
                also store the valuation generated for you. That valuation is
                illustrative only — it is not an appraisal or a professional
                opinion of value.
              </li>
              <li>
                <strong>Real estate professional waitlist.</strong> If you sign
                up for the Realtor Hub, we collect your full name, email
                address, brokerage, and city or market.
              </li>
              <li>
                <strong>Messages you send us.</strong> If you use a contact
                form, we collect your name, email address, phone number
                (optional), whether you are looking to buy or sell, and your
                message.
              </li>
            </ul>

            <h3 className="font-heading text-lg font-semibold text-[#111111] mt-6 mb-2">
              (b) Information created as you use the Platform
            </h3>
            <ul className="mt-1 list-disc pl-6 space-y-1.5">
              <li>
                Properties you save, properties you view, and searches you save
                (including the filters in them).
              </li>
              <li>
                Open houses you plan to attend and whether you marked them
                attended or skipped.
              </li>
              <li>
                Alerts generated for you — new listings, price drops, status
                changes, and open houses — and whether you have read them.
              </li>
              <li>
                Basic account activity such as how many times you have signed in
                and when you last viewed your personalized brief.
              </li>
            </ul>

            <h3 className="font-heading text-lg font-semibold text-[#111111] mt-6 mb-2">
              (c) Information collected automatically
            </h3>
            <ul className="mt-1 list-disc pl-6 space-y-1.5">
              <li>
                Technical information such as your IP address, device and
                browser type, the pages you visit, the referring URL, and your
                language preference.
              </li>
              <li>
                A randomly generated visitor identifier stored in a cookie, used
                to report listing activity to CREA and to distinguish repeat
                visits. It is not linked to your name and, for signed-out
                visitors, it is not linked to an account. See sections 4 and 5.
              </li>
            </ul>

            <h3 className="font-heading text-lg font-semibold text-[#111111] mt-6 mb-2">
              (d) Location information
            </h3>
            <p>
              The Platform does not ask your browser for your location and does
              not use device geolocation. When you pan or zoom the map, the
              coordinates of the area you are viewing are sent to the
              OpenStreetMap Nominatim service to look up the name of that place
              — this describes the map view, not your device, and is not stored
              on our servers or attached to your account.
            </p>
          </section>

          {/* 3. How we use it */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              3. How We Use Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1.5">
              <li>provide, operate, secure, and maintain the Platform;</li>
              <li>create and authenticate your account;</li>
              <li>
                personalize your feed, recommendations, search results, and your
                Vicinus brief based on your preferences and activity;
              </li>
              <li>
                deliver your inquiry to the listing REALTOR® and respond to
                messages you send us;
              </li>
              <li>
                generate the illustrative property valuation you request and
                follow up about it;
              </li>
              <li>
                send alerts and notifications you have asked for, such as saved
                search matches and price drops;
              </li>
              <li>
                report listing views, click-throughs, and REALTOR® inquiries to
                CREA as required by our data licence (see section 5);
              </li>
              <li>
                measure and improve the Platform, diagnose problems, and prevent
                fraud, spam, and abuse; and
              </li>
              <li>comply with our legal and regulatory obligations.</li>
            </ul>
            <p className="mt-3">
              We rely on your consent for these purposes. Providing information
              is voluntary, but some features — signing in, saving properties,
              contacting a REALTOR®, or requesting a valuation — cannot work
              without the information they ask for. We do not use your personal
              information for a new purpose without your consent, unless the law
              permits or requires it.
            </p>
            <p className="mt-3">
              We do not make decisions that produce legal or similarly
              significant effects about you using automated processing alone.
            </p>
          </section>

          {/* 4. Cookies */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              4. Cookies and Similar Technologies
            </h2>
            <p>We use a small number of cookies and browser storage:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1.5">
              <li>
                <strong>Authentication cookies</strong> set by Clerk to keep you
                signed in and protect your session.
              </li>
              <li>
                <strong>A visitor cookie</strong> (<code>vic_vid</code>)
                containing a random identifier we issue. It is HTTP-only and
                signed — page scripts cannot read it — and it expires after one
                year. It exists so that listing activity reported to CREA can be
                de-duplicated, as our data licence requires.
              </li>
              <li>
                <strong>Browser storage</strong> used to cache things like your
                personalized brief for the duration of a tab session, so we do
                not recompute it on every page load.
              </li>
            </ul>
            <p className="mt-3">
              We do not use advertising cookies, and we do not allow third-party
              advertising networks to track you across other websites through the
              Platform. You can block or delete cookies through your browser
              settings; if you do, sign-in and some personalized features will
              not work.
            </p>
            <p className="mt-3">
              <strong>Product analytics.</strong> We use PostHog to understand
              how visitors use the Platform and to improve it. Analytics
              tracking only runs if you accept it in the cookie banner shown on
              your first visit; if you reject it or have not yet responded, no
              analytics events are captured. You can change your choice at any
              time by clearing the <code>vicinus_consent</code> cookie in your
              browser and revisiting the site.
            </p>
          </section>

          {/* 5. Listing data and CREA */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              5. Listing Data and CREA DDF®
            </h2>
            <p>
              The Platform displays property listing data provided by the
              Canadian Real Estate Association (CREA) through its Data
              Distribution Facility (DDF®). That listing content — including
              agent and office contact details published with a listing — comes
              from CREA and its members, not from you.
            </p>
            <p className="mt-3">
              As a condition of using the DDF®, we are required to report
              listing activity back to CREA. When you view a listing, click
              through to it, or send an inquiry to a listing REALTOR®, we send
              CREA the listing identifier, the type of event, your visitor
              identifier, your IP address, the referring URL, and your language
              preference. We do not send CREA your name, email address, or
              account details as part of this activity reporting.
            </p>
          </section>

          {/* 6. Sharing */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              6. When We Share Your Information
            </h2>
            <p>
              <strong>We do not sell your personal information.</strong> We share
              it only in the following circumstances.
            </p>

            <h3 className="font-heading text-lg font-semibold text-[#111111] mt-5 mb-2">
              (a) With REALTORS® you choose to contact
            </h3>
            <p>
              When you submit an inquiry on a listing, your name, email address,
              phone number, preferred contact method, and message are forwarded
              to the listing REALTOR® — through CREA’s DDF® Lead service and our
              internal lead system — so they can respond to you. Once your
              inquiry reaches a REALTOR® or their brokerage, they handle your
              information as an independent organization under their own privacy
              policy, and we do not control what they do with it.
            </p>

            <h3 className="font-heading text-lg font-semibold text-[#111111] mt-5 mb-2">
              (b) With service providers who work on our behalf
            </h3>
            <p>
              These providers process information only to deliver services to
              us, under contract, and are not permitted to use it for their own
              purposes:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1.5">
              <li>
                <strong>Clerk</strong> — account creation, sign-in, and session
                management.
              </li>
              <li>
                <strong>Netlify and Railway</strong> — website hosting,
                application hosting, database, and caching.
              </li>
              <li>
                <strong>Airtable</strong> — recording buyer inquiries, seller
                and contact-form submissions, and waitlist signups so our team
                can follow up.
              </li>
              <li>
                <strong>Mapbox</strong> — map display and geocoding. Mapbox
                receives your IP address and the map area you are viewing when
                maps load.
              </li>
              <li>
                <strong>OpenStreetMap</strong> — converting the coordinates of
                the map area you are viewing into a place name (section 2(d)).
              </li>
            </ul>

            <h3 className="font-heading text-lg font-semibold text-[#111111] mt-5 mb-2">
              (c) For legal and business reasons
            </h3>
            <p>
              We may disclose personal information where required or permitted by
              law — for example in response to a valid legal demand, to
              investigate suspected fraud or abuse, to protect the rights and
              safety of users or the public, or to enforce our Terms. If Vicinus
              is involved in a merger, acquisition, financing, or sale of assets,
              personal information may be transferred as part of that
              transaction, subject to this Policy.
            </p>
          </section>

          {/* 7. Cross-border */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              7. Storage Outside Canada
            </h2>
            <p>
              Some of the service providers listed in section 6 store or process
              information outside Canada, including in the United States. While
              information is in another country, it is subject to that country’s
              laws and may be accessible to its courts, law enforcement, and
              national security authorities under a lawful order. We use
              providers that commit to appropriate contractual and technical
              protections. You can ask our Privacy Officer for more information
              about our practices for handling information across borders.
            </p>
          </section>

          {/* 8. Retention */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              8. How Long We Keep Information
            </h2>
            <ul className="mt-1 list-disc pl-6 space-y-1.5">
              <li>
                <strong>Account and preference information</strong> is kept for
                as long as your account is active, and is deleted on request as
                described in section 9.
              </li>
              <li>
                <strong>Saved properties, saved searches, viewed listings, open
                house plans, and alerts</strong> are kept while your account is
                active; you can remove individual items at any time from your
                dashboard.
              </li>
              <li>
                <strong>Inquiries, seller and valuation submissions, contact
                messages, and waitlist signups</strong> are kept for as long as
                needed to respond and to keep a record of the request, and then
                deleted on request.
              </li>
              <li>
                <strong>The visitor cookie</strong> expires one year after it is
                set.
              </li>
            </ul>
            <p className="mt-3">
              We may keep information longer where we are required to by law, or
              where we need it to resolve a dispute or enforce our agreements.
              Information we have already delivered to a REALTOR® is retained
              by them under their own policies.
            </p>
          </section>

          {/* 9. Rights */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              9. Your Choices and Your Rights
            </h2>
            <p>Subject to applicable law, you may:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1.5">
              <li>
                <strong>Access</strong> the personal information we hold about
                you and ask how it has been used and disclosed;
              </li>
              <li>
                <strong>Correct</strong> information that is inaccurate or
                incomplete — you can update your name and email in your account
                settings, and your preferences by redoing onboarding;
              </li>
              <li>
                <strong>Delete</strong> your account and the personal
                information associated with it;
              </li>
              <li>
                <strong>Withdraw consent</strong> to our use of your information
                at any time, subject to legal or contractual restrictions and
                reasonable notice — withdrawing consent may mean we can no
                longer provide certain features; and
              </li>
              <li>
                <strong>Opt out</strong> of alerts and non-essential messages, as
                described in section 10.
              </li>
            </ul>
            <p className="mt-3">
              To make a request, email our Privacy Officer at{' '}
              <a
                href="mailto:info@vicinityproptech.com"
                className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
              >
                info@vicinityproptech.com
              </a>
              . We will respond within 30 days, or tell you if we need an
              extension and why. We may need to verify your identity before
              acting, and in limited cases the law permits us to refuse a
              request — if so, we will explain why.
            </p>
            <p className="mt-3">
              If you are not satisfied with our response, you may complain to
              the Office of the Privacy Commissioner of Canada, or to the Office
              of the Information and Privacy Commissioner for British Columbia
              where BC PIPA applies.
            </p>
          </section>

          {/* 10. Communications */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              10. Communications
            </h2>
            <p>
              We send service messages related to your account and the alerts you
              have asked for, such as saved search matches, price drops, and open
              house reminders. You can turn alerts off in your dashboard. Any
              commercial electronic message we send will comply with Canada’s
              anti-spam legislation (CASL) and will include a way to unsubscribe.
              We cannot unsubscribe you from a REALTOR® who is responding to an
              inquiry you sent them — contact them directly.
            </p>
          </section>

          {/* 11. Security */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              11. Security
            </h2>
            <p>
              We apply administrative, technical, and physical safeguards
              appropriate to the sensitivity of the information, including
              encryption in transit, signed HTTP-only session and visitor
              cookies, access controls limiting staff access to what their role
              requires, and rate limiting to deter abuse. No method of
              transmission or storage is completely secure, so we cannot
              guarantee absolute security. If a breach creates a real risk of
              significant harm to you, we will notify you and the appropriate
              regulator as the law requires.
            </p>
          </section>

          {/* 12. Children */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              12. Children
            </h2>
            <p>
              The Platform is intended for adults searching for or selling real
              estate. It is not directed at children, and we do not knowingly
              collect personal information from anyone under the age of majority
              in their province or territory. If you believe a child has provided
              us with personal information, contact us and we will delete it.
            </p>
          </section>

          {/* 13. Third-party links */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              13. Links to Other Sites
            </h2>
            <p>
              The Platform links to third-party websites, including REALTOR.ca
              and REALTOR® and brokerage websites. We do not control those sites
              and are not responsible for their content or privacy practices.
              Their own privacy policies apply once you leave the Platform.
            </p>
          </section>

          {/* 14. Changes */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              14. Changes to this Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Changes take
              effect when posted on this page, and the “Last updated” date above
              will reflect the most recent revision. If a change materially
              affects how we use information you have already given us, we will
              provide notice and, where required, obtain your consent.
            </p>
          </section>

          {/* 15. Contact */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-[#111111] mb-3">
              15. Contact Our Privacy Officer
            </h2>
            <p>
              For privacy questions, access or deletion requests, or complaints,
              contact our Privacy Officer at{' '}
              <a
                href="mailto:info@vicinityproptech.com"
                className="text-[#1C3829] underline underline-offset-2 hover:text-[#111111]"
              >
                info@vicinityproptech.com
              </a>
              .
            </p>
            {BUSINESS_ADDRESS && (
              <p className="mt-3">Vicinus, {BUSINESS_ADDRESS}</p>
            )}
          </section>
        </div>
      </article>
    </div>
  )
}
