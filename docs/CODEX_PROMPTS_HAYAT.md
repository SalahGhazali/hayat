# HAYAT × Codex — البرومبتات الجاهزة

**طريقة الاستخدام (بالعربي):**
1. افتح مجلد `hayat-mvp` (فيه ملفات v0.1 والشعار المعتمد) كمستودع Git.
2. انسخ `AGENTS.md` إلى جذر المشروع، وانسخ `docs/HAYAT_FULL_PROJECT_BRIEF_AR.md` إلى مجلد `docs/`. (Codex يقرأ `AGENTS.md` تلقائياً؛ لا تعتمد على `CLAUDE.md`.)
3. شغّل Codex من جذر المشروع، والصق **البرومبت 0** أولاً. راجع النتيجة، ثم الصق البرومبتات A ثم A2 ثم B→E واحداً واحداً. (A2 للصفحة الرئيسية والحركة والصور؛ ضع صور الخلفية التي تريدها في `assets/img/backgrounds/` قبله إن أمكن.) لا تلصق الكل مرة واحدة: الجلسات الطويلة تضيع منها التفاصيل، والتقسيم يعطيك نقطة مراجعة بعد كل مرحلة.
4. إذا شغّلت Codex السحابي: اجعل **سكربت الإعداد (Setup script)** هو الذي يثبّت حزم npm (الإنترنت يعمل فيه). مرحلة التنفيذ تكون عادة بلا إنترنت، ولهذا نطلب نسخ المكتبات داخل `assets/vendor/`.
5. إذا انقطعت الجلسة أو بدأت جلسة جديدة: الصق برومبت **Resume** في الأسفل.

---

## البرومبت 0 — الفحص والخطة (لا يكتب ميزات)

```text
You are the senior frontend engineer on HAYAT (حياة), my graduation project: a blood-donation coordination web platform. Your job over the next prompts is to IMPLEMENT AND COMPLETE the existing frontend-only interactive MVP (static HTML/CSS/vanilla JS), not to plan sprints and not to rebuild from scratch.

Start now. Do not ask me whether to proceed.

1. Read AGENTS.md fully, then docs/HAYAT_FULL_PROJECT_BRIEF_AR.md. Then read, if they exist: CLAUDE.md, docs/UI_COMPONENTS_AND_SOURCES.md, docs/ACCEPTANCE_TESTS.md, docs/DECISIONS_AND_OPEN_QUESTIONS.md, README.md. If CLAUDE.md conflicts with AGENTS.md or the brief, follow AGENTS.md and record the conflict in docs/DECISIONS_AND_OPEN_QUESTIONS.md.
2. Inspect the whole repo: pages, assets/img (approved logo — do not touch), assets/css, assets/js, tests.
3. Check the environment: node/npm versions, whether Playwright/Chromium is available, whether the network is available right now.
4. Write docs/IMPLEMENTATION_PROGRESS.md with: (a) what already works (verified by opening/running it, not assumed), (b) what is missing per screen ID P01–S07 and per state screen, (c) risks and the phase plan A→E, (d) what you could not check and why.
5. Do not implement features in this prompt. Commit only the progress file.

End with a short summary: current state, the 5 biggest gaps, and any question that is truly irreversible and ambiguous (if none, say so).
```

---

## البرومبت A — الأساس البصري (UI Foundation)

```text
Phase A — UI foundation. Follow AGENTS.md sections 2, 3, 7, 8 and 9.

- Vendor pinned libraries into assets/vendor/ (Tabler core RTL build, Tabler Icons webfont, SweetAlert2, Chart.js, AOS, CountUp.js, Swiper only if needed, Cairo font) via npm during setup; remove runtime CDN dependencies.
- Create assets/js/motion.js (AOS/CountUp/Chart defaults, prefers-reduced-motion handling, .js-motion gate) per AGENTS.md section 3b, and shared chart defaults (RTL, Arabic, brand palette, animation) in one place. Write docs/DEPENDENCIES.md (name, exact version, official URL, license, files used). If you cannot fetch something, say so and stop on that item — never imitate it by hand.
- Create assets/css/hayat-theme.css with overrides only: brand colors, Cairo, always-white background and color-scheme light, disabled theme switching, 44px touch targets, no page-level horizontal overflow.
- Build the reusable shell from real Tabler layouts (RTL): AppShell, Header, Sidebar, MobileDrawer (offcanvas), PageHeader, DataTable, FormField, StatusBadge, EmptyState, Toast, ConfirmDialog (SweetAlert2), LoadingSkeleton, ErrorState, SuccessState. One shared implementation reused by donor/, bank/ and admin/.
- Use the exact approved logo files from assets/img.
- Build/standardize status pages: 403, 404, temporary error, logout success, email verified, password reset done.
- Audit and keep the existing register/login/verify flow working; fix only what is broken or non-compliant.
- Verify at 320, 375, 390, 768, 1024, 1440 px: RTL, white background (also with prefers-color-scheme: dark), no horizontal scroll. Say honestly how you verified (screenshots/Playwright vs manual).

Update docs/IMPLEMENTATION_PROGRESS.md and commit ("Phase A: UI foundation"). Report briefly: done, not done, checks run.
```

---

## البرومبت A2 — الصفحة الرئيسية والصفحات العامة (حركة + صور)

> قبل هذا البرومبت: ضع صور الخلفية التي تريدها في `assets/img/backgrounds/` إن كان عندك صور. إن لم تضع، سيحاول Codex تحميل صور مجانية الترخيص أثناء الإعداد (إن توفر الإنترنت) ويوثّق مصدرها.

```text
Phase A2 — Home and public experience. Follow AGENTS.md sections 2, 3b, 7.

- Rebuild P01 Home (and P02 How it works, inside Home or separate) from real Tabler layouts: hero with a bounded background image + overlay (page body stays #FFFFFF), clear CTAs to register/login, animated how-it-works steps (AOS: fade-up/fade/zoom-in only, once), animated KPI counters (CountUp.js) fed from the mock store with a visible "بيانات تجريبية" label, a medical-responsibility notice ("حياة تنسّق التبرع ولا تتخذ قرارات طبية"), footer. Swiper only if it genuinely improves the steps on mobile.
- Use Tabler's real sign-in/cover layouts for Login/Register/Verify/Forgot/Reset, with a bounded image or illustration panel on large screens that collapses cleanly on mobile.
- Add designed 403/404/status pages with a suitable image or local illustration.
- Images: use assets/img/backgrounds/ files first; otherwise download only free-license images during setup and record file, URL, author and license in docs/ASSETS_CREDITS.md. If neither is possible, use local non-figurative SVG/CSS patterns and list the empty slots. Optimize (WebP/AVIF + fallback, ≈200 KB max, srcset for hero, lazy-load below the fold, Arabic alt). No Red Cross/Red Crescent emblems, no identifiable patients/children, no fake testimonials, no hotlinking.
- Verify at 320/375/390/768/1024/1440 px: text over images readable (contrast ≥ 4.5:1), no horizontal overflow AFTER animations initialize, content visible with JS disabled, and prefers-reduced-motion shows everything instantly. Say honestly how you verified.

Update docs/IMPLEMENTATION_PROGRESS.md and commit ("Phase A2: Home and public pages"). Report briefly: done, not done, checks run.
```

---

## البرومبت B — وحدة المتبرع

```text
Phase B — Donor module. Follow AGENTS.md sections 4, 5, 6, 7.

First make assets/js/store.js the single mock store (entities, deterministic seed, reset, atomic multi-entity writes, Node-testable via module.exports guard) if it is not already. Then complete: P03 Register (field errors, duplicate email/phone, "لا أعرف" blood type, no future last-donation date), A01 Verify (Demo Mailbox mock OTP, wrong code, resend, success), A02/A03 Forgot/Reset, P04 Login (all states, role redirect, pending → verify), logout with confirm and success screen.
Donor screens D01–D07 on live store data: dashboard, notifications & requests with filters, request details with accept/decline (0 points, closed requests rejected), non-medical eligibility estimate, profile editing incl. notification preferences, confirmed-donations-only history, points ledger. Every screen needs empty, loading and error states with useful Arabic copy and a call to action.

Write Node tests for registration uniqueness, pending-account blocking, accept/decline (points unchanged). Run them and report real results. Update IMPLEMENTATION_PROGRESS.md and commit ("Phase B: Donor module").
```

---

## البرومبت C — وحدة بنك الدم

```text
Phase C — Bank module. Follow AGENTS.md sections 4, 5, 6, 7.

Implement B01–B08 on the shared store, scoped by the session's bankId on every query:
- B01 dashboard KPIs for the own bank only; B02 create request (units > 0, urgency, radius, notes, preliminary candidate matching by blood type + area, "لا أعرف" excluded, in-app notifications only); B03 manage/search/sort/cancel/fulfil with confirm dialogs; B04 request details showing responders SEPARATELY from confirmed units, with "record linked donation"; B05 search donors (privacy-minded: no more personal data than needed); B06 record donation (registered donor only, date, optional linked request or direct), one confirmation = one donation + exactly one +5 transaction + audit log + donor notification, idempotent on repeat; B07 reports with filters and animated Chart.js charts (requests over time, donations by blood type, points; shared chart defaults, RTL, Arabic labels, table fallback), own bank only; animated counters on B01; B08 staff management visible and permitted ONLY for the Official Representative (bankId from session, activation flow for the new employee, suspend/enable).
- There must be NO "add donor"/"register donor" control anywhere in the bank area. For an unregistered walk-in, add an instruction panel in B05/B06 explaining: help the donor open the public sign-up on THEIR phone, then come back and record the donation. Provide a link/QR-style hint to the public register page.
- Staff opening Manage Staff directly by URL gets the designed 403 page.

Node tests: T05, T06, T09, T10, T11, T14. Run them, report real results. Update IMPLEMENTATION_PROGRESS.md and commit ("Phase C: Bank module").
```

---

## البرومبت D — مدير النظام

```text
Phase D — System Admin module. Follow AGENTS.md sections 4, 5, 6, 7.

Implement S01–S07: dashboard across banks; manage users (search, suspend/activate with confirm, no arbitrary role escalation, data minimised); manage banks (create bank + first Official Representative with initial account, edit/suspend bank); monitor requests across banks with filters and documented stop action; donation records with confirming employee, bank and optional request; health supervision reports inside Admin (by bank and period, ledger totals, animated Chart.js charts with shared defaults, animated KPI counters on S01) — no fourth role; settings & audit log including points correction: one compensating −5 per mistaken donation with reason, actor and time, original transaction preserved, duplicate correction refused.
Admin must not be able to confirm donations on behalf of bank staff.
Node tests: T04, T13, T15 plus a check that ledger sums equal reported totals everywhere. Run them, report real results. Update IMPLEMENTATION_PROGRESS.md and commit ("Phase D: Admin module").
```

---

## البرومبت E — التكامل والاختبار والتسليم

```text
Phase E — Integration, QA, documentation.

1. Run the cross-role slice end to end: new donor registers → verifies → admin-created bank/rep → rep adds staff → staff creates O+ request → donor accepts (points unchanged) → staff confirms linked donation (+5 once) → donor, bank and admin all show the same totals; then repeat with a direct walk-in donation; then the correction (−5) path. Fix whatever breaks.
2. Execute T01–T20. Automated where possible (Node, and Playwright only if actually available); otherwise a documented manual script. Write real results in docs/ACCEPTANCE_TESTS.md: Pass / Fail / Not run + reason. Never mark a test passed that you did not execute.
3. Check mobile/RTL/white-background at 320/375/390/768/1024/1440, reload persistence (T19), and offline-CDN behaviour (T20). Also check motion: prefers-reduced-motion, no horizontal overflow after AOS/Swiper init, content visible without JS, chart animations not blocking data, image weights and docs/ASSETS_CREDITS.md complete, docs/DEPENDENCIES.md lists every motion library with license.
4. Find dead buttons/links with a crawl or script and fix them.
5. Update README: how to run (static server), demo accounts, "Reset Demo Data", privacy/mock warning (not secure, per-browser data), file list, libraries and licenses, limitations. Update docs/DECISIONS_AND_OPEN_QUESTIONS.md with every default you chose and every open question from AGENTS.md section 12.
6. Commit ("Phase E: integration and QA").

Final report: what is actually implemented, tests actually run with results, tests not run and why, known limitations. Then ask me for the functional review. Do NOT propose or write sprints/backlog yet.
```

---

## Resume — لمتابعة جلسة منقطعة

```text
Resume work on HAYAT. Read AGENTS.md and docs/IMPLEMENTATION_PROGRESS.md, run git log --oneline -10 and git status, and check the last phase's tests still pass. Continue from the first unfinished item without redoing finished work. Keep updating IMPLEMENTATION_PROGRESS.md and commit at the end of the phase. Report what changed and what remains.
```

---

## Review — مراجعة مستقلة بعد كل مرحلة (اختياري)

```text
Review the changes since the last phase commit against AGENTS.md without editing files. List only concrete violations with file and line: wrong role/permission, bankId leakage between banks, points awarded on accept/registration, double +5, missing -5 audit trail, a staff "add donor" control, hard-coded CDN URLs, non-white page background (images allowed only in bounded sections), horizontal overflow at 320px (also after AOS/Swiper init), animations ignoring prefers-reduced-motion, uncredited or oversized images, fake "real" statistics without the demo label, dead buttons, English template strings, medical-decision wording. Say "no violations found" only if you actually checked each item.
```
