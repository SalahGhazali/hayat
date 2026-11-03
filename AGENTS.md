# AGENTS.md — HAYAT (حياة) frontend-only MVP

Codex reads this file automatically (32 KiB cap, so it is kept short and in English).
Full Arabic detail lives in `docs/HAYAT_FULL_PROJECT_BRIEF_AR.md` — read it before building anything.

## 0. What you are building

HAYAT is a **blood-donation coordination web platform** (graduation project). It coordinates between licensed blood banks and volunteer donors.
**It makes NO clinical decisions.** Screening, donor eligibility, lab tests and transfusion compatibility are done outside the app by licensed staff. Never word the UI as medical approval.

**Current deliverable: an interactive FRONTEND-ONLY MVP** — not a plan, not static mockups, not a generic AI dashboard. Extend the existing v0.1 files; do not rebuild from scratch and do not delete working login/verification code.

**Do NOT create product sprints, backlog or user stories.** Build the MVP, then stop and ask the owner for a functional review. Sprints are derived only after approval.

## 1. Read first (in order, if they exist)
1. this file
2. `docs/HAYAT_FULL_PROJECT_BRIEF_AR.md` (binding decisions, screens, tests)
3. `CLAUDE.md` (legacy notes from another tool; extra detail only — on any conflict follow this file and the brief, and record the conflict in `docs/DECISIONS_AND_OPEN_QUESTIONS.md`)
4. `docs/UI_COMPONENTS_AND_SOURCES.md`, `docs/ACCEPTANCE_TESTS.md`, `docs/DECISIONS_AND_OPEN_QUESTIONS.md`
5. `README.md`, existing source, `reference/Hayat_Graduation_Project_Original.pdf` (background only; newer owner decisions win)

## 2. Non-negotiable constraints
- Runtime = **static HTML + CSS + vanilla JavaScript**. No React/Vue/TypeScript/Laravel, no backend, no real auth, no real email/SMS/push, no shared DB.
- Data = one centralized **mock store** in `localStorage` (same browser, same origin), seeded, persistent across reloads, with a predictable **Reset Demo Data** (test environment only).
- UI = **real free Tabler UI** components with the official RTL build (https://docs.tabler.io/ui/components , https://preview.tabler.io/). Icons = Tabler Icons. Confirm dialogs = SweetAlert2. Charts = Chart.js. Leaflet optional. No Tailwind/Flowbite/Preline mixed in, no premium/Pro template copying, no emoji icons, no glassmorphism, no full-screen gradients, no Lorem Ipsum.
- **Exact approved logo from `assets/img/`** (`hayat-logo-wordmark.png`, `hayat-logo-symbol.png`; reference boards alongside). Never regenerate, redraw or replace it. Do not use the full brand board as the site logo.
- Arabic, `lang="ar" dir="rtl"`, Cairo font (Inter for Latin). Colors: primary `#C62828`, deep `#A91D2A`, teal `#0F766E`, text `#1F2937`, soft surface `#F3F6F8`, border `#E2E8F0`.
- **Page background is ALWAYS pure `#FFFFFF`**, even if the browser prefers dark mode: `<meta name="color-scheme" content="light">`, `:root{color-scheme: only light}`, `html,body{background:#FFFFFF}`, Tabler theme switching disabled. Do not break forced-colors accessibility. Background **images** are allowed only inside bounded sections (hero, banners, auth cover panel, status pages) — never as the page/body background (see section 3b).
- Mobile first. Must work at 320/375/390/768/1024/1440 px, correct RTL, **no page-level horizontal scroll** (tables scroll inside their own container), touch targets ≈ 44 px, sidebar = offcanvas on mobile.
- No dead buttons. Every control either works in the simulation or is clearly marked unavailable. Show a "وضع تجريبي" badge where the simulation could be mistaken for the real thing.
- UI copy is clear, short **Arabic**; never leave default English template strings.

## 3. Dependencies — IMPORTANT for the Codex sandbox
The Codex agent phase usually has **no internet** (setup phase does). So:
- Fetch libraries once (setup/`npm`) and **commit them under `assets/vendor/`**; pages must NOT depend on a CDN at runtime. This also satisfies test T20.
- Sources: `@tabler/core` (use `dist/css/tabler.rtl.min.css` + JS), `@tabler/icons-webfont`, `sweetalert2`, `chart.js`, `@fontsource/cairo` (and Inter if used), plus the motion libraries in section 3b (`aos`, `countup.js`, optionally `swiper`).
- **Pin exact versions** (no `latest`). Record name, version, URL, license, and which files are used in `docs/DEPENDENCIES.md`. Check licenses; note any plugin with a different license than MIT.
- npm/dev tooling is allowed only to fetch vendor files and run tests. The shipped site needs no build step and runs from any static server (`python3 -m http.server` or VS Code Live Server).
- If a library cannot be fetched (no network), say so plainly in the report. Do not fake it with hand-written lookalikes and call it Tabler.

## 3b. Motion, interactive libraries and imagery (owner request — required)
Goal: a lively, modern, real-product feel. Motion must be purposeful, never decorative noise.

**Libraries** (vendor locally, pin versions, check each license and record it in `docs/DEPENDENCIES.md`):
- **Chart.js** for every chart: built-in draw-in animation (~600–800 ms), `rtl: true`, Arabic labels/tooltips, brand palette (`#C62828`, `#0F766E` + neutrals), a title and a text/table fallback, never color-only meaning. Do not add a second chart library.
- **AOS** (scroll reveal) on Home and "how it works" only. Use `fade-up`, `fade`, `zoom-in` with `once: true`. **No horizontal slide variants** (they overflow at 320 px, especially in RTL).
- **CountUp.js** for KPI/points counters on Home and dashboards, fed from the store. On Home, counters must carry a visible "بيانات تجريبية" label — never present seed numbers as real impact.
- **Swiper** (RTL, `dir="rtl"`) only where a carousel truly helps on mobile (e.g. how-it-works steps, request cards). Optional.
- Native CSS for the rest: card hover/focus lift, button press, skeleton shimmer, toast slide-in, subtle pulse on a new-notification badge. GSAP only if a specific effect needs it (not MIT — record its license); default is not to use it.

**Rules:** one `assets/js/motion.js` initializes everything. Respect `prefers-reduced-motion: reduce` (no AOS, no count-up, no chart animation — show final values immediately). Durations 200–600 ms. No animation on tables or forms. No parallax, particles, 3D, autoplay video or infinite loops. Content must stay visible if JS fails (hidden initial states only under a `.js-motion` class). No layout shift. Re-check 320 px horizontal overflow **after** AOS/Swiper init.

**Imagery:** the page/body stays `#FFFFFF`. Background images are allowed only in bounded areas: Home hero, section/CTA banners, the auth cover panel (use Tabler's real sign-in cover/illustration layouts), 403/404/status pages. Never behind tables, forms or dashboard data.
- Text over an image: overlay confined to that block, contrast ≥ 4.5:1, mobile-tuned `background-position`, readable at 320 px.
- Sources: files the owner placed in `assets/img/backgrounds/` first. Otherwise download during the setup phase (network) only from free-license sources (Unsplash/Pexels/Pixabay), check each license, and record file, URL, author and license in `docs/ASSETS_CREDITS.md`. No hotlinking, no random web-search images, no AI-generated photos presented as real. If there is no network and no files: use local non-figurative SVG/CSS patterns and list the empty image slots in the report.
- Subjects: blood donation, care, community/volunteers, hands, drops. No identifiable patients or children, no fake testimonials, no real organizations' logos, **no Red Cross/Red Crescent emblems** (legally protected), nothing implying endorsement by a real institution.
- Performance: WebP/AVIF (+ JPG fallback), ≈200 KB max each, responsive `srcset` for the hero, `loading="lazy"` below the fold, width/height set, Arabic `alt` (empty `alt` when decorative).
- Home (P01) content: hero with image + CTAs, demo-labeled animated counters, animated how-it-works steps, medical-responsibility notice, footer. The approved logo is never replaced.

## 4. Roles — exactly three (`donor`, `bank`, `admin`)
Bank accounts carry `bankId` and `isOfficialRepresentative`. These are account types, not extra roles.

| Operation | Donor | Bank Staff | Official Rep. | Admin |
|---|:--:|:--:|:--:|:--:|
| Self-register as donor | ✓ | public page, on donor's phone | same | — |
| Accept/decline a targeted request | ✓ | — | — | — |
| Create/edit/close requests | — | ✓ | ✓ | monitor only |
| Search candidate donors | — | ✓ | ✓ | per admin review |
| Record/confirm actual donation | — | ✓ | ✓ | — |
| Bank reports (own bank only) | — | ✓ | ✓ | ✓ (all banks) |
| Add/manage bank staff (own bank only) | — | — | ✓ | oversight |
| Create bank + first Official Rep. | — | — | — | ✓ |
| Correct points (audited) | — | — | — | ✓ |
| Health Supervision Reports | — | — | — | ✓ (inside Admin) |

- Admin creates the bank **and** its first Official Representative. The Rep adds staff (`bankId` taken from the Rep's session, never from a form field). Staff get identical operational powers except staff management; the "Manage Staff" screen/link is hidden from them and returns 403 if opened.
- **No fourth role** (no "Health Supervisor" login). Admin does not confirm donations on behalf of bank staff.
- **No "Add Donor"/"Staff registers donor" anywhere in the bank dashboard.** Walk-in unregistered donor → staff helps them open the public sign-up **on the donor's own phone**; donor sets their own password and verifies their own email; staff then returns to the bank dashboard, finds the account and records the donation. Staff never sees the donor's password or OTP.
- Role guards in JS are demo-only (not secure); say so in the README.

## 5. Business rules
**Donor signup:** full name, email (required, unique), phone (required, unique, validated), password + confirm, blood type (8 types or "لا أعرف"), city, area; optional exact location and last-donation date (not in the future). Flow: `register → pending_verification → simulated email verification (Demo Mailbox, 6-digit mock OTP) → active → donor dashboard`. Pending accounts cannot reach protected pages. Never claim a real email was sent. OTP expiry/attempt/resend limits are MVP assumptions — mark them as open.
**Login:** one screen for all roles, email or phone + password; states: missing data, wrong credentials, suspended, unverified (→ verify), success (→ role home).
**Forgot password:** email → generic non-revealing message → demo link/code → new password + confirm → success → login.
**Logout:** confirm → clear demo session → "تم تسجيل الخروج بنجاح" screen; protected pages inaccessible afterwards.

**Request → response → donation are three separate things:**
- Request (`active → fulfilled | cancelled`): bank, blood type, units > 0, urgency `normal|high|critical`, radius, notes. Bank/location come from the logged-in staff.
- Candidate matching = preliminary red-cell ABO/Rh recruitment + donor availability, visibility consent and the platform waiting period. Unknown blood types are not auto-matched. This is a recruitment filter, never clinical clearance or a plasma/whole-blood compatibility decision. Final screening/crossmatch remains with the bank. Notifications are in-app only.
- Response (`pending → accepted | declined`): **accepting gives 0 points** and creates no donation. Cancelled requests accept no responses. Bank views show responders count **separately** from confirmed units.
- Donation: staff records it for a registered donor (date, bank auto, optional linked request, or direct walk-in with `requestId = null`). Confirmation creates one confirmed donation and **exactly one +5 point transaction per donation id**. Confirming the same donation again changes nothing.

**Points:** +5 only for an actually completed donation confirmed by an authorized bank. 0 for signup, accept, visit, rejection, cancellation. Balance = **sum of `pointTransactions`** (never an editable field). Mistaken donation → Admin posts one compensating −5 with reason, actor, time; the original stays in the audit trail; no silent delete; no second −5, no second +5. No cash rewards.

**State machines:** donor account `pending_verification → active | suspended`; bank employee `pending_activation → active → suspended`; request `active → fulfilled|cancelled`; response `pending → accepted|declined`; donation `recorded → confirmed` (no points before confirmed).

## 6. Mock store (`assets/js/store.js`)
Entities: `users`, `banks`, `bankStaff`, `requests`, `responses`, `donations`, `pointTransactions`, `notifications`, `auditLogs`, plus `session`. Stable readable IDs. All reads/writes through the store API; pages never touch `localStorage` directly. Writes that span entities (confirm donation → donation + points + audit + notification) are one function so they stay consistent. Every bank query is filtered by the session's `bankId`.
Seed (deterministic): 1 admin; 2 banks, each with 1 Official Rep. + 1 staff; ~8 donors across blood types/cities incl. one `pending_verification` and one "لا أعرف"; a few requests, responses, donations and point transactions so no screen is empty on first load — plus the empty-state paths must still be testable with a fresh account. Document all demo accounts in README and show a "demo accounts" helper on the login page (test environment only).
Say explicitly in README: data is per-browser; a staff member on another device will not see a donor registered elsewhere until a real backend exists.

## 7. Screens (29 logical; shared pages/dialogs are fine, every journey must work)
Public: P01 Home, P02 How it works (may live in Home), P03 Register, P04 Login. Auth: A01 Verify email, A02 Forgot password, A03 Reset password.
Donor: D01 Dashboard, D02 Notifications & requests, D03 Request details (accept/decline), D04 Eligibility (non-medical "تقدير أولي"), D05 Profile, D06 Donation history (confirmed only), D07 My points (ledger).
Bank: B01 Dashboard (own bank KPIs), B02 Create request, B03 Manage requests, B04 Request details (responses, confirmed units, record linked donation), B05 Search donors, B06 Record donation, B07 Donation reports, B08 Staff management (Rep only).
Admin: S01 Dashboard, S02 Manage users, S03 Manage banks (+ first Rep), S04 Monitor requests, S05 Donation records, S06 Health supervision reports, S07 Settings & audit (points corrections).
State screens (not counted): registration success, mock OTP sent, email verified, password reset done, logout success, 403, 404, temporary error, empty, no results, loading, confirm dialogs.
Shared UI pieces: AppShell, Header, Sidebar, MobileDrawer, PageHeader, DataTable (search/sort/filter), FormField, StatusBadge, EmptyState, Toast, ConfirmDialog, LoadingSkeleton, ErrorState, SuccessState — build once as HTML templates + small JS, reuse everywhere.

## 8. Required UI states
Success (account created, email verified, logged out, request published, response saved, donation confirmed, +5 added, staff added) · Errors (duplicate email/phone, wrong/expired OTP, closed request, duplicate donation, permission denied, missing data) · Empty (no requests, notifications, donations, points, staff, search results) · Loading (save/search/refresh/confirming) · Confirmations (cancel request, suspend account, confirm donation, correct points, logout). Errors appear next to fields; valid input is preserved on a failed submit.

## 9. Project layout
```
index.html register.html login.html verify.html forgot-password.html reset-password.html status.html (403/404/logout/etc.)
donor/  bank/  admin/
assets/img/        approved logo — never change
assets/css/        hayat-theme.css (overrides only; Tabler stays untouched in vendor)
assets/img/backgrounds/  optimized hero/banner photos (credits in docs/ASSETS_CREDITS.md)
assets/vendor/     pinned Tabler, icons, SweetAlert2, Chart.js, AOS, CountUp.js, (Swiper), fonts
assets/js/         store.js roles.js auth.js requests.js donations.js points.js notifications.js ui-feedback.js motion.js core.js
docs/              brief, UI sources, acceptance tests, decisions, DEPENDENCIES.md, IMPLEMENTATION_PROGRESS.md
tests/             Node logic tests + optional browser tests
reference/         original PDF
```
Use **classic scripts with a single global namespace (e.g. `Hayat`)** so pages also work from `file://`; guard with `if (typeof module !== 'undefined') module.exports = …` so `store`/`points`/`donations` logic can be unit-tested in Node with an in-memory storage shim.

## 10. Build phases (MVP phases — NOT product sprints)
A UI foundation (Tabler RTL, theme, shell components, motion setup, states, audit existing auth) → A2 Home & public pages (motion + imagery) → B Donor module → C Bank module → D Admin module → E Integration + QA + docs.
Work phase by phase. **Commit after each phase** with a clear message. Keep `docs/IMPLEMENTATION_PROGRESS.md` current (works / missing / next) so a new session can resume from it.

## 11. Acceptance tests (run them; do not claim results you did not observe)
T01 new signup stays pending until verify · T02 duplicate email/phone rejected, no duplicate user · T03 three roles land on correct home · T04 admin creates bank + Rep · T05 Rep adds staff on same bank; staff has no Staff Management · T06 O+ request reaches only matched donors · T07 accept → responders +1, points unchanged · T08 decline → visible to bank, no points · T09 confirm linked donation → 1 donation + one +5 + reports updated · T10 re-confirm same donation → no new records/points · T11 direct donation (no request) → +5 visible to donor, bank, admin · T12 walk-in unregistered donor signs up on own phone, then staff finds and records donation; no staff add-donor · T13 correction → one −5 with reason + audit, no silent delete · T14 bank 1 cannot see bank 2 data · T15 admin reports match ledger · T16 logout ends session, success screen, role pages blocked · T17 empty/error/403/404 pages designed, no Lorem Ipsum · T18 six viewports: RTL + white + no horizontal scroll · T19 reload keeps state · T20 CDN/network down → core UI still readable (vendored assets).
Minimum: Node tests for store/points/donations/RBAC rules (T02, T07–T11, T13, T14, T15) and a documented manual script for the rest. Use Playwright for T01/T03/T12/T16/T18/T19 only if it is actually available in the environment; otherwise document the manual steps and say they were not run.

## 12. Do NOT decide (list as open questions instead)
Appointment booking (not a confirmed feature) · blood-type verification/correction policy · medical eligibility intervals (never present as a medical ruling) · OTP expiry/attempts/resend rules · GPS-denied location/privacy policy · real-database duplicate protection · export/permissions of personal health-supervision reports · offline write/sync.

## 13. Working rules
- Inspect before editing; reuse what works. Prefer small coherent edits over rewrites. Do not touch `assets/img/` or `reference/`.
- Do not stop at description or ask me to build pages by hand. If the work spans sessions, finish a testable vertical slice (register → verify → login → bank creates request → donor accepts → bank confirms donation → +5 in donor/bank/admin) and document the rest precisely.
- Ask the owner only about irreversible decisions that could reasonably go either way; otherwise choose the sensible default, record it in `docs/DECISIONS_AND_OPEN_QUESTIONS.md`, and continue.
- Final report must state: what was actually implemented, which tests were actually run (with results), what was not run, known limitations, and the demo accounts. Then ask for the owner's functional review.

## 14. Definition of Done
Runs on a plain static server with no backend/DB · every listed screen and journey works on consistent mock data · same design across Donor/Bank/Admin with the approved logo and real Tabler components/icons · Arabic RTL, always-white page background, responsive, all feedback states present · animated charts/counters/scroll reveals with reduced-motion support and credited, optimized background images (section 3b) · T01–T20 documented with real results · README (run steps, demo accounts, privacy warning, files, libraries and licenses, limitations) · final report delivered for owner approval before any sprint planning.


## 15. Owner refinements retained from the active review
- Owner approved donor-initiated voluntary donation and blood-type examination requests. Add `voluntary_requests` separately from campaigns, donor institution search/ranking and request history, bank request inbox/details, accept-and-schedule, alternative times, rejection/withdrawal, scoped notifications and early actual-donation confirmation. One pending/accepted voluntary request or campaign coordination per donor. Self-initiated requests do not change visibility/availability preferences. Examination requests are allowed during the donation waiting period; donation requests are not. No points for submission/acceptance/examination, +5 once only for confirmed actual donation; preserve the 3-month wait and never manufacture a campaign for a voluntary request.
- Nearby ranking uses only the existing demo institutions/coordinates and must be labeled approximate demo data; unknown coordinates show unavailable distance. Do not imply live GPS, current real hospital availability or add a real hospital recommendation from an example name. Send unknown-type registrants a persisted guidance notice immediately and show guidance during verification and on donor pages, linking to a typing appointment after activation.
- Owner explicitly approved staff entry of examined blood type. Authorized bank staff record an attested result/reference and actor/bank/time; a known-type change needs a reason. Scoped accepted typing appointments complete without donation/points. Unknown blood type must be recorded before new donation confirmation, including legacy recorded entries. Protect an institution-recorded type against donor profile edits; preserve historical donation snapshots. This records a staff-entered result, not an automated medical decision. Support registered walk-ins from the existing record-donation form, never bank-created donor accounts.
- Owner requested compact action-success feedback like logout. Use the shared local Tabler toast after successful saves/commands, with a concise Arabic action message, close button and a 3-second success lifetime. Include donation completion, invitations, appointments, responses, profile/staff/institution edits, moderation, refresh and generated export files. Redirecting successes use a session-scoped notice tied to the destination and current user, consumed once; refresh, a manually supplied `recorded` query, canceled confirmations and validation errors must not produce false success. Keep logout's existing one-shot 3-second behavior. Navigation, opening dialogs, filters and cancel buttons do not announce a completed save.
- Latest institution-notification layout review: do not render a notification summary/list automatically in the dashboard. Keep the actionable notification button with its unread count at the side of the top bar beside the profile; its label stays visible on mobile and it opens the dedicated inbox. Preserve notification generation, read state and scope rules.
- Owner requested institution notifications: provide `bank/notifications.html`, a bank menu entry and header bell/unread counter on every bank page. Include accept/decline/withdraw events, existing appointment replies, campaign completion/closure and admin donation corrections, with scoped request/report links, search, pagination, individual/bulk read controls and same-origin live updates. Read state is shared by the bank's staff in this demo; it must never mark another institution's or donor-private notifications. Migrate past response summaries once without changing responses/donations/points. Repeat acceptance or decline does not create duplicate events.
- Owner approved compatible-group campaign discovery (e.g. O donors for A) and targeted donor invitations. Use one sourced red-cell ABO/Rh recruitment rule across campaign visibility, automatic notices, candidate lists, manual invitations and linked donation validation; preserve the donor's actual declared group in donation history. Exclude recent confirmed/self-declared donations, unavailable/private donors, unverified/suspended/unknown groups and donors coordinating with another campaign. Profile visibility consent is separate from notification emphasis. Every invitation is bank-scoped, revalidates current eligibility/consent, persists one in-app notice and audit per donor/campaign, and awards no points or acceptance. All eligible compatible donors can discover the campaign; geographic ranking is deferred to the backend and the old radius no longer excludes them. Source: https://professionaleducation.blood.ca/en/transfusion/clinical-guide/blood-administration (red cells and Rh tables; plasma has different rules).
- Owner removed manual distance/radius selection: no radius input on request creation/editing and no radius displayed in request cards/details. Real automatic nearest-donor selection is deferred to the backend. Preserve existing synthetic distance data; the frontend demo uses its internal default when creating without a radius and retains a request's value when editing. Rename optional coordination notes to Arabic arrival instructions with a concrete example and explain that donors see them; never collect patient identifiers there.
- Owner follow-up: automatically mark a campaign/request `fulfilled` when its confirmed linked donations reach its requested units. Do this in the same store write as the final confirmation, release remaining coordination/appointments, notify affected donors, and reject further linked records/responses. Acceptance, pending records and direct donations do not fulfill a campaign. Existing fully donated active requests are reconciled once without changing their donation/points history. Correcting a donation later does not silently reopen the campaign.
- On 3 November 2026 the owner explicitly approved appointment coordination and a three-calendar-month platform waiting period after confirmed donation. This supersedes section 12's deferral for these features: bank proposes a date/time after donor acceptance; donor accepts or requests a specific alternative; bank reviews and sends a new proposal. Bank confirms the completed donation from the responder row as soon as the donor accepts the appointment, regardless of its scheduled time. Persist one donation/+5 and show a daily countdown across donor pages; block new acceptance, matching and donation confirmation inside the interval. This is a coordination rule, never clinical clearance. Existing records stay intact; corrected donations no longer count toward the waiting period.
- Owner's latest surface review requests colored containers instead of uniform white: use soft rose, mint and warm neutral card surfaces with readable dark text; keep the page's white base and the fixed Home decoration. Login now uses the locally licensed direct donation photo instead of the hands photo.
- Latest Home visual request explicitly allows a decorative blood-donation background fixed to the viewport while scrolling, and replaces the Home hands photo with a direct donation photo. Scope this exception to `body[data-page="home"]`; preserve legibility and forced-colors support. This supersedes the earlier plain Home background restriction, without adding parallax animation.
- Latest explicit logout review uses direct login redirect + one-shot3second Tabler toast, with confirmation. The older generic logout-success-screen wording above is fulfilled through that approved feedback flow. Preserve the legacy logout URL without logging out a currently active user.
- A donor has one ongoing accepted coordination. Hide other calls without deleting them; allow explicit withdrawal. Personal coordination does not close the institution-wide request or award points. Preserve ended coordination after donation correction.
- Assets/img protection applies to existing approved logos/reference boards; section3b authorizes new credited backgrounds only.
- Existing approved analysis remains decision history; docs/HAYAT_FULL_PROJECT_BRIEF_AR.md consolidates the supplied instructions with these owner refinements. No separate full brief was supplied in Downloads; do not pretend it was.
