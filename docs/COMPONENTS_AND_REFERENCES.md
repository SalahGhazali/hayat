# Ready-made UI libraries and concrete references — use with Codex

**Implemented in v0.2:** Tabler Core 1.7.3 RTL + Icons Webfont 3.34.1, vendored with MIT notices. Actual component/source mapping and free upstream examples: [TABLER_IMPLEMENTATION.md](TABLER_IMPLEMENTATION.md). Runtime pages no longer load the v0.1 custom stylesheet.

## Primary implementation — Tabler UI + Tabler Icons (SELECTED)
**Use this as the single component system for the Hayat MVP, not as optional inspiration.**

- Tabler Admin Template: https://tabler.io/admin-template
- Live demo (actual pages): https://preview.tabler.io/
- Component docs and copied HTML examples: https://docs.tabler.io/ui
- GitHub official open-source source: https://github.com/tabler/tabler
- Official Icon Catalog: https://tabler.io/icons
- Tabler icon webfont source: https://github.com/tabler/tabler-icons

Verified 2026-10-31: Tabler UI is based on Bootstrap 5 and provides RTL variants, responsive dashboards, sidebars, badges, forms, validation, cards, modals, toast notifications, tables, empty and error pages. Free core released under MIT; don't use paid Pro assets without proper rights.

**Use official example markup**, adapted to data and RTL, with `assets/css/hayat-theme.css` overrides for branding. Avoid re-creating common components. Verify current package path/version in docs before pinning and importing; no unpinned `@latest` for final reproducible MVP. In Tabler theme configuration, turn OFF `dark`, `auto`, and theme-toggle UI completely, with `color-scheme: only light`, `html/body { background:#fff }`.

### Page-to-ready-component mapping
| Hayat area | Recommended Tabler UI pieces |
|---|---|
| Home | free/marketing layout sections, navigation, features, call-to-action, FAQ accordion |
| Register/Login/Verify/Reset | auth cards, forms, input states, password controls, steps, alert and success |
| Logout + system feedback | toast, modal, standalone success/error templates, 403/404 |
| Donor dashboard | dashboard shell, KPI cards, compact request list, latest activity |
| Donor requests/notifications | list groups, badge status, tabs, notification list, empty states |
| Donation history/points | responsive table, summary cards, timeline or activity list |
| Bank dashboard | admin sidebar, KPI cards, responsive request table, charts if useful |
| Request creation/details | validated form, filter bar, table, tabs, status badges, confirm modal |
| Record donation | search/select form, optional request field, confirmation modal, success toast |
| Representative staff | team/user table, add-employee modal/form, deactivate confirmation |
| Bank reports | table, filters, print/export mock action clearly labelled if not implemented |
| System Admin | admin sidebar, multi-bank reports, filters, accounts/institutions tables, audit log |

Before copying a component from the demo, ensure the template and included assets license permits its use; do not copy premium assets.

## Alternative sources — ONLY IF OWNER EXPLICITLY CHANGES THE UI LIBRARY
1. **Preline UI**, Tailwind HTML/JS blocks and templates: https://preline.co/ and https://preline.co/templates/ ; https://preline.co/docs/ . It may require Tailwind + build step and premium screens are paid.
2. **Flowbite**, Tailwind + vanilla JS components: https://flowbite.com/ and https://flowbite.com/blocks/ ; https://flowbite.com/docs/getting-started/introduction/ . Some blocks/premium screens are paid. Do not combine Flowbite with Tabler Bootstrap component CSS for this MVP.

**Design principle:** The user requested real existing library page examples rather than assistant-invented layouts. Choose and adapt actual free examples from these official catalogs, preserve licensing, consistent colors, clean white background, RTL Arabic, mobile support and the user's approved logo.
