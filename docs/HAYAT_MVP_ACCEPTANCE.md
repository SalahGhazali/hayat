# Hayat Frontend MVP — Codex acceptance / QA checklist

All tests use synthetic data and SAME browser/origin; do not claim multi-device sync.

Reviewed 2026-11-01 against the owner files and the implemented frontend. Evidence: `tests/store.test.cjs`, `tests/browser.mjs`, `tests/completion.mjs`, `tests/commitment.mjs`, `tests/alignment.mjs`, `tests/visual.mjs`, `tests/logout.mjs`, and [QA_RESULTS.md](QA_RESULTS.md). The exact T01–T20 map is in [ACCEPTANCE_TESTS.md](ACCEPTANCE_TESTS.md). These checks describe the local prototype and tested Edge layouts; they do not certify medical decisions, production security, other browsers, or complete accessibility conformance. Logout follows the approved one-shot toast behavior.

Latest observed results: 35/35 store tests; browser 35 pages, 210 viewport checks and 35 HTTP-200 link targets; completion 12 groups; commitment 6; alignment 13; logout 4; visual checks passed. An independent public-page check passed 60 additional layouts after motion initialization. The alignment run includes cross-tab updates while the mobile drawer is open.

## A. Foundation, usability and feedback
- [x] Home and all routes load without missing CSS/JS; approved logo is the same as user reference, not newly generated.
- [x] Every screen uses existing **Tabler UI** components/layouts, Tabler Icons, uniform Cairo font, approved palette.
- [x] On a device/browser configured for dark mode, ALL pages remain LIGHT, with white page background and legible inputs/modals.
- [x] At 320, 375, 390, 768, 1024 and 1440px, RTL menu/drawer works, no body horizontal overflow and control sizes are usable.
- [x] Shared Tabler toast, inline validation, SweetAlert2 confirmations, Tabler editing/reason modals, loading skeleton, empty states, 403, 404, temporary error and one-shot 3-second logout toast work.
- [x] Links and visible actions go somewhere real or are honestly disabled/labelled as demo; no dead buttons.
- [x] AOS is limited to the two public information pages; Chart.js charts have titles and table fallbacks; store-fed CountUp values carry a demo label on Home. Reduced-motion and public content without JavaScript were exercised.
- [x] Images, fonts and pinned runtime libraries load locally; external requests were blocked during the alignment test without breaking the core UI. Images and licenses are recorded in [ASSETS_CREDITS.md](ASSETS_CREDITS.md) and [DEPENDENCIES.md](DEPENDENCIES.md).

## B. Authentication (mock only)
- [x] Donor registers with required **unique phone and email** and reasonable client-side validation; unknown blood type allowed.
- [x] Donor can't access dashboard before mock email verification; errors/resend/reset follow documented states.
- [x] Login routes to the right dashboard for donor, bank rep, bank staff, admin; logout invalidates demo session and shows success.
- [x] Role-based navigation is guarded in prototype (explicitly NOT security).

## C. Bank staff hierarchy
- [x] Admin creates a new bank and its FIRST official representative.
- [x] Representative sees Add Employee; can create/deactivate employees for OWN bank.
- [x] A new employee starts `pending_activation` and cannot use bank operations until completing mock email verification. Suspending the account blocks an already-open verification form; restoring an unverified employee preserves the pending activation requirement.
- [x] Employee CANNOT see or use staff-management operations; DOES have same donor search, request, record donation, bank reports access as representative.
- [x] Bank A staff cannot see/mutate Bank B records in the simulation.
- [x] No fourth Health Supervisor role and no Add Donor feature in the bank dashboard.

## D. Donation requests / matching
- [x] Bank staff creates request: blood group, units, urgency, radius, bank auto-scoped.
- [x] Bank staff can edit an active request with a recorded reason, updated matching and preserved response history; cross-bank and closed-request edits fail. Blood-group changes cannot corrupt ongoing coordination or confirmed linked donations.
- [x] Compatible *declared blood group and area* candidates receive in-app mock notifications; unknown blood type not auto-matched.
- [x] Donor accepts/declines: response counters update, donation count and points do NOT.
- [x] Request status can transition active -> fulfilled/cancelled; closed requests refuse new accept actions.
- [x] Admin can stop an active request as `cancelled` with reason and audit; cannot create, edit or fulfil requests, and cannot confirm donations.
- [x] One ongoing coordination per donor: accepting changes the personal status to waiting for coordination, replaces accept/decline with withdrawal, hides other calls without deleting notifications, and blocks a second acceptance through a direct URL or store call.
- [x] Withdrawal restores other matching calls, including after profile/availability changes. Acceptance is idempotent; the bank request stays active and other donors can respond.
- [x] Closing the request, suspending the donor/institution, or confirming the relevant donation ends coordination. Reactivation or donation correction does not revive it; historical donation entry does not interrupt later coordination. Legacy multiple acceptances migrate once with audit history.

## E. Donation confirmation and rewards
- [x] Staff finds existing donor and records COMPLETED donation with related request OR with no request (walk-in).
- [x] An unregistered walk-in donor signs up via PUBLIC registration page on their own phone; staff then finds account and records completed donation (no staff-created donor account).
- [x] Only once confirmed, donation creates a UNIQUE +5 points transaction, counted in donor history and donor points.
- [x] Reconfirming an existing confirmed donation id returns it unchanged; attempts to create a duplicate record are rejected. Neither case double-awards points.
- [x] Confirmation writes the donation, single +5, audit and donor notification together. Direct donations use `requestId = null` and notifications point to donor history.
- [x] Correction is Admin-only and posts exactly one compensating -5 with reason, actor and time, preserving the original award and audit. Bank correction and repeat correction are rejected; a corrected donation cannot be reconfirmed.
- [x] Bank report displays only its bank's donations/points, admin health report aggregates all bank data.

## F. Demo run and handoff
- [x] Test complete journey: admin -> create bank rep -> rep adds staff -> staff creates request -> donor responds -> bank confirms donation -> donor +5 and history -> admin reports.
- [x] Test alternate journey: donor visits bank WITHOUT request -> completed donation +5.
- [x] Refresh pages and verify state persists within same browser until demo reset.
- [x] README documents how to run and reset demo plus limitations (no server, no real email/SMS, no medical authorization, no actual security).
- [x] Central `assets/js/store.js` migrates legacy user data without resetting records; deterministic seeds include 13 accounts: eight donors, two representatives, two employees and one admin. All demo credentials are listed in README.
- [x] Report ACTUAL browser/tests run and any known failures. Never mark unchecked items as passed based on code review alone.

Coordination-flow evidence: 35 passing store tests and six passing browser groups in `tests/commitment.mjs` / `test-results/commitment.json`, including donor/bank tabs and layouts at 320px and 1440px. The 25-test count in older reports is historical. Full browser and completion suites were rerun after alignment with the owner files.
