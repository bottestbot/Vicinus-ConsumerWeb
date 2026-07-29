# PRD: Neighbourhood Vibe Check

**Status:** Draft
**Owner:** RC
**Date:** 2026-07-29

## 1. Problem / Opportunity

Vicinus already computes rich, real neighbourhood data for 382 named BC neighbourhoods — livability sub-scores (walkability, transit, schools, amenities), raw "vibe" signals (bike lane density, green cover %, proximity to rail/highway/airport), housing age character, and price data. None of this is exposed as a fun, front-door consumer experience — it's buried on neighbourhood detail pages that only get seen after a user already has a target area in mind.

Meanwhile, onboarding today (`OnboardingWizard.tsx`) collects `lifestylePriorities` (schools/commute/transit/parks/dining/walkability/quiet) as a flat multi-select — functional for personalization, but not a shareable, fun experience. It's transactional intake, not a hook.

**Opportunity:** turn our existing scoring data into a BuzzFeed-style quiz — "Which Vancouver-area neighbourhood matches your vibe?" — that (a) is fun enough to share, (b) captures structured preference data we can feed into the existing personalization pipeline, and (c) drives new-user acquisition via social/organic sharing.

## 2. Goals

**Primary**
- Ship a standalone, no-login-required quiz at `/vibe` — short and easy to type/share on social — that produces a shareable neighbourhood match result at `/vibe/<shortId>`.
- Capture quiz answers as structured preference data, tied to a session/user, that plugs into the existing `personalization.service.ts` match pipeline.
- Make the result screen inherently shareable (OG image, "share your result" card) to drive organic/social traffic.

**Secondary**
- Convert quiz completers into signed-up users (soft prompt: "save your match / see full breakdown / get listing alerts").
- Feed quiz-derived preference signals back into onboarding so returning users skip redundant questions.

**Non-goals (v1)**
- Not replacing onboarding's transactional intake (goal/timeline/budget/bedrooms) — vibe check is a separate, lighter-weight, fun layer.
- Not attempting quiz coverage outside BC's 382 seeded neighbourhoods.
- Not building custom illustration/animation pipeline for v1 — ship with clean, on-brand static design; motion/illustration is a fast-follow.

## 3. Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Quiz starts | Baseline volume via marketing push |
| Completion rate (start → result) | ≥ 70% |
| Share rate (result → share action) | ≥ 15% |
| Quiz → account creation | ≥ 8% |
| Quiz-driven sessions as % of new traffic | Track weekly via PostHog |

Instrument every step (start, per-question answer, completion, share-click, share-platform, signup-from-quiz) as PostHog events per the existing analytics plan ([[project_data_pipeline]]).

## 4. User Flow

1. **Landing** — single CTA screen: "What's your neighbourhood vibe? Take the 90-second quiz." Optional entry point: city/region selector if we later expand beyond Metro Vancouver (v1: default to BC-wide, weighted toward the 10 transit-scored Metro Vancouver cities where data is richest).
2. **Quiz** — 8–10 lightweight, scenario-style questions (see §5), single-select, big tappable image/emoji cards, progress bar, no text-heavy Likert scales.
3. **Result** — "You're a match with **[Neighbourhood Name]**" + a generated vibe archetype (e.g. "The Café-Hopping Urbanite"), match %, 3–4 reason chips pulled from real data ("high walkability," "leafy & green," "steps from transit"), neighbourhood hero photo.
4. **Share** — one-tap share card (image generated server-side) for Instagram Stories / iMessage / X, pre-filled caption, deep link back to `/vibe/<shortId>?ref=<code>` for referral attribution.
5. **Soft conversion** — below the result: "See 2 more neighbourhoods that match your vibe" (blurred/locked) → sign up or enter email to unlock, consistent with how we already gate deeper personalization. Signing up from here must land the user back on this exact result page, not the onboarding wizard — see §9.

## 5. Quiz Design — Mapping Fun Questions to Real Data

Each question maps to one or more existing scoring dimensions so the result is backed by actual data, not vibes-as-decoration. Reuse the same dimension set as `blend.ts` / `personalization.service.ts` (walkability, transit, schools, amenities) plus the currently-unsurfaced "vibe" raw fields (`bikeLaneKm`, `greenCoverPct`, `nearestMajorRoadM`, `nearestRailM`, `nearestAirportM`) for flavor/personality framing, and `housingAge` for character framing.

| # | Question | Answer options → scoring |
|---|---|---|
| 1 | Friday night, you're... | Rooftop patio, new restaurant just opened → Amenities ++ · Backyard bonfire, string lights, maybe a neighbour drops by → Quiet ++, Green + · Catching a show or gallery opening → Amenities ++, Transit + · Home by 8, and thrilled about it → Quiet +++ |
| 2 | How do you actually get around? | Walk or bike almost everywhere → Walkability +++, bikeLane ++ · Bus/train, don't own a car → Transit +++ · Drive, and honestly prefer it → neutral/drive · Whatever the day calls for → small even bump |
| 3 | Sunday morning looks like? | Farmers market, then a coffee crawl → Amenities ++, Walkability + · Trail run or a walk in the woods → Green ++ · Sleeping in, zero plans, zero people → Quiet ++ · Kid's soccer game, then brunch with the family → Schools ++, Amenities + |
| 4 | Pick a soundtrack for your street | Café chatter and clinking cups → Amenities ++ · Birdsong and rustling leaves → Green +++ · The friendly beep of a bus pulling up right on time → Transit + · Dead quiet — you can hear yourself think → Quiet +++ |
| 5 | A highway on-ramp two minutes from home is... | Perfect, I drive everywhere anyway → neutral/drive · A dealbreaker — I want green space, not overpasses → Green ++, flavor: prefers distance from major roads · Don't really care → neutral |
| 6 | Your dream home is... | A character heritage house with creaky charm → flavor: older housing era · A sleek new-build condo or townhome → flavor: newer housing era · Honestly, the neighbourhood matters way more than the house → neutral |
| 7 | How much do schools factor into where you'd live? | A ton — top priority → Schools +++ · Someday, thinking ahead → Schools + · Not really a factor for me → no weight |
| 8 | Errand day means... | Everything's in walking distance, it's a 15-minute neighbourhood → Walkability +++, Amenities ++ · Quick drive to grab what I need → neutral/drive · Groceries delivered — I rarely leave the house → Quiet + |
| 9 | Bike lanes on your street: | Non-negotiable, I ride everywhere → bikeLane +++, Walkability + · Nice to have → bikeLane + · Don't bike, don't care → neutral |
| 10 | Your ideal "close to home" escape | A 20-minute flight out of town — hate wasting time getting to the airport → flavor: proximity to airport · A weekend drive up the coast or into the mountains → Green + · Honestly I never want to leave my neighbourhood — it has everything → Amenities +++, Walkability ++ |
| 11 | Your workday looks like... | Work from home, rarely commute → Quiet ++, Green + · Commute downtown to an office → Transit +++, Walkability + · Commute somewhere else in the region → neutral/drive · Hybrid — a couple days in, a couple from home → Transit +, Quiet + |

Q5, Q6, and Q10 are pure "flavor/tiebreaker" questions — they don't touch the core walkability/transit/schools/amenities blend, only reason-chip and archetype generation (see §6). Q10's airport option is the weakest signal of the eleven and the first to cut if the quiz runs long.

Design note: keep copy playful and visual (icon cards, confident personality-quiz tone), not a disguised settings form — this is the core "make it fun" requirement.

## 6. Matching Algorithm

1. Each answer maps to a weight adjustment on the four blended dimensions (walkability/schools/amenities/transit), reusing the exact mechanism in `personalization.service.ts` that already turns `lifestylePriorities` into per-user dimension weights — this quiz is effectively a much richer, funner input to the same function.
2. Vibe-flavor questions (highway proximity, bike lanes, green cover, rail noise, housing era) don't change the score weighting — they're used as **tiebreakers and flavor-chip generators** among the top-N scored neighbourhoods, since these raw fields aren't part of the core livability blend today.
3. Compute per-user weighted score against all 382 neighbourhoods using existing `livabilityScore`/sub-scores; take the top match, plus 2 runners-up for the "unlock more matches" gate.
4. Match % = normalize the top neighbourhood's weighted score against the user's own max possible score (same approach as existing `matchPercent`), not against other neighbourhoods, so most users see an encouraging 80–95% rather than a harsh curve.
5. **Data gap handling:** transit sub-score is `null` outside the 10 scored Metro Vancouver cities, and `housingAge` has ~41% listing-sample coverage. If a dimension is missing for a candidate neighbourhood, reweight proportionally (same fallback `blend.ts` already does) and drop any reason chip that depends on missing data rather than showing a wrong/empty chip.

## 7. Archetype & Copy System

9 named "vibe archetypes," one per dimension/lifestyle signature, derived from which answers dominate the user's quiz. Each gets its own accent colour (no two archetypes share a hue) so the result card, the "which archetype are you" teaser, and any future archetype-browse page read as a coherent, colourful system rather than a single-tone product.

| Archetype | Tagline | Dominant signature | Colour | Icon |
|---|---|---|---|---|
| The Café-Hopping Urbanite | "You want life happening outside your front door — coffee, dinner, culture, all within stumbling distance." | Amenities +++, Walkability +++ | Coral | coffee |
| The Transit Maximalist | "Car-free and proud of it — you want a bus or train close enough that the schedule barely matters." | Transit +++ | Blue | bus |
| The Trailhead Local | "Your happy place has more trees than traffic. Quiet mornings and trail access beat a nightlife scene every time." | Green +++, Quiet ++ | Green | trees |
| The Heritage Homebody | "Character over new construction, always. You want creaky floors, mature trees, and a street that feels lived-in." | housingEra = older, Quiet ++ | Amber | building-arch |
| The Family Basecamp | "You're planting roots for the long haul — good schools, parks, and a community that knows your kids' names." | Schools +++, Amenities + | Teal | users |
| The New-Build Minimalist | "Clean lines, modern amenities, low maintenance — you want a neighbourhood as fresh as your finishes." | housingEra = new, Amenities ++, Walkability + | Gray | cube |
| The Everything-in-Reach Local | "Why leave? Groceries, gym, dinner, drinks — it's all inside your own 15-minute world." | Walkability +++, Amenities +++ | Pink | shopping-bag |
| The Quiet Introvert | "Peace and privacy over foot traffic. You want a street where the loudest thing is the wind." | Quiet +++ (low Amenities/Transit); absorbs the WFH signal from Q11 as a chip variant ("home-office-friendly quiet") | Purple | moon |
| The Downtown Commuter | "You need to get downtown fast and back home even faster — proximity to the core is non-negotiable." | Transit +++, Walkability + | Red | briefcase |

Ties default to the archetype whose signature most overlaps the *matched neighbourhood's* own top sub-scores, so the card copy always feels consistent with the actual place, not just the quiz answers in isolation. Archetype name + tagline + result neighbourhood + 3 reason chips + its accent colour is the full shareable payload — keep it to one clean card, not a report.

## 8. Data Model & Persistence

- New table `VibeCheckResult`: `id, shortId (short, URL-safe — the public /vibe/<shortId> slug), userId (nullable — anonymous allowed), sessionId, answers (Json), archetypeKey, matchedNeighbourhoodId, matchPercent, matchRarityPct (share of quiz-takers matched to the same neighbourhood, recomputed periodically), runnerUpIds (Json), referralCode, referredByResultId (nullable, for the friend-comparison screen), createdAt`.
- Anonymous-first: quiz must work fully logged-out, tracked by a `sessionId` (new — **confirmed there is no existing anonymous-session-to-account merge pattern anywhere in the codebase**; the closest precedent, `useBrief.ts`'s `sessionStorage` cache, is a signed-in per-tab cache, not a pre-auth merge, so this needs to be built from scratch: a `sessionId` cookie/localStorage value written on first quiz visit, sent with the result, and matched up to the user record on first authenticated load via a merge endpoint).
- On signup-from-quiz, feed `answers` into `parseOnboardingBlob`'s `lifestylePriorities` so onboarding can skip/pre-fill that step rather than asking twice.

## 9. Routing & Auth Handoff

**Short URL.** Quiz lives at `/vibe`; each result gets a short, social-friendly slug at `/vibe/<shortId>` (e.g. `vicinus.ca/vibe/k3jf9x`) — `shortId` is a short nanoid on `VibeCheckResult`, not the DB row's cuid, so the shared URL stays compact.

**Login/signup must return to the exact result page, not the onboarding wizard.** Confirmed how auth and onboarding actually work today:
- Clerk's `<SignIn>`/`<SignUp>` (`src/app/(auth)/sign-in/[[...rest]]/page.tsx`, `src/app/(auth)/sign-up/[[...rest]]/page.tsx`) both currently hard-code `fallbackRedirectUrl="/dashboard"`. `forceRedirectUrl` is **not** used anywhere, which matters: Clerk natively honours a `redirect_url` search param *before* falling back to `fallbackRedirectUrl` — so linking the quiz's "sign up to unlock more matches" CTA to `/sign-up?redirect_url=/vibe/<shortId>` sends the user back to their result with no change needed to Clerk config itself.
- The onboarding wizard is **not** a hard redirect — it's a global modal. `OnboardingGate.tsx` (mounted in root `layout.tsx`) pings the session on every signed-in page load and pops `OnboardingModal` over whatever route the user lands on, based on `showOnboarding` computed server-side in `users.service.ts` (`!onboardingCompleted && loginCount % 5 === 1`). It already has a path-skip check (skips paths starting with `/onboarding`).
- **Important scoping correction:** a blanket "skip `/vibe/*` always" rule is too broad — it would also suppress onboarding if the same person organically revisits `/vibe` in an unrelated *later* session, which should behave normally. The suppression must be scoped to *this one post-signup return trip only*, not the route. Implementation: right before the quiz's sign-up/sign-in CTA navigates to Clerk, write a one-time flag to `sessionStorage` (e.g. `vicinus:vibe-auth-return`); `OnboardingGate` checks for it on its very next mount, suppresses the modal once, and immediately clears the flag. Because it's `sessionStorage` (not a cookie or path check), it's inherently gone if the browser tab/session ends — so a genuinely new session landing on `/vibe` later gets the normal onboarding behaviour, exactly as it should.

## 10. Virality Mechanics

**The card is the shareable unit, not a link.** Result screen renders a portrait share card: archetype name, matched neighbourhood photo, match %, 3–4 reason chips, a mini bar breakdown of the four dimensions, and a rarity line ("only 6% of quiz takers match here," computed live from the actual quiz-taker distribution). Rarity framing is the single highest-leverage element on the card — people share things that make them feel distinctive, not things that make them feel average.

- **Native share sheet first.** "Share result" triggers the Web Share API on mobile with a pre-rendered image attached, so it drops into Instagram Stories/iMessage/WhatsApp as an image, not just a link. Desktop falls back to "copy image" + "copy link."
- **Every result's short URL is OG-tagged** (`vicinus.ca/vibe/<shortId>`) so a bare pasted link (Slack/Discord/X/iMessage) unfurls with the same archetype/neighbourhood/match% baked into the preview image — no click required to see the payoff. (Implementation detail: confirm the OG-image rendering approach against this repo's actual Next.js version/conventions per `AGENTS.md` before building — don't assume standard `next/og` behavior.)
- **Referral loop:** shared links carry `?ref=<resultId>`. Quiz-starts-from-referral are logged in PostHog to measure real viral coefficient, not just share-button clicks. When someone completes the quiz via a referral link, show a bonus comparison screen ("you and Sarah are both Café-Hopping Urbanites" / "you're 40% compatible neighbourhoods") — a specific reason to send to a friend rather than post generically.
- **Tone:** confident personality-quiz voice, not neutral data — "You're 91% Kitsilano. Deal with it," not "Your calculated neighbourhood match is Kitsilano (91%)."
- V2: full "compare with a friend" mode (send them the quiz, see both results side-by-side) — flag as post-launch, not required for v1.

## 11. Open Questions / Risks

1. **Geographic scope at launch** — full BC-wide 382 neighbourhoods, or restrict v1 to the 10 Metro Vancouver cities with full transit data for a more complete/confident result? *Recommend restricting v1 scope and expanding later* — avoids "quiet/no transit score" results feeling incomplete during the exact moment we want max virality.
2. **Email gate placement** — gating "2 more matches" behind email may hurt share rate (friction before the fun part is fully free). Consider: full free result + share, gate only the *deeper personalization* (full listing search filtered to match, saved-search alerts).
3. **Legal/compliance** — confirm quiz result imagery/copy doesn't imply real estate advice; keep framing as "lifestyle match," not valuation or investment guidance.
4. **Housing-age sample coverage** (~41%) means the "character vs. new build" question could occasionally reason-chip on thin data — worth a confidence threshold before surfacing that specific chip.

## 12. Phased Rollout

- **V1:** Quiz + result + share card, Metro Vancouver 10-city scope, anonymous-first, soft signup gate on deeper matches. Instrumented in PostHog.
- **V2:** Expand to full BC 382-neighbourhood set once transit-score gaps are backfilled or gracefully handled; "compare with a friend"; feed results into email nurture (Klaviyo) for quiz completers who didn't convert.
- **V3:** Seasonal/marketing variant quizzes (e.g. "Which Vancouver neighbourhood matches your Halloween vibe") reusing the same engine for recurring marketing moments.
