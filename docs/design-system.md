# Nexora interface system

## Checkpoint

Frontend: `99664210657eeca427dc3e559297e5c55b3bf27e`.
Backend: `6a0e0dc98a7aa77a8f45b21ae572ac05c2761f74`.
The repositories are separate; all previous work was committed before the redesign.

## Direction

Graphite surfaces, restrained mint accents, editorial typography, and compact financial information. Brand accent indicates selection and primary actions; profit, loss, and warning colors retain their financial meanings. Avoid decorative gradients inside data views.

## Foundation

- **Typography:** locally hosted Geist Variable, supplied by the existing `@fontsource-variable/geist` dependency. No external font requests or new runtime dependencies. Landing headlines scale from 42–80px; page titles 24–34px; section titles 14–18px; body 13–14px; supporting text 11–12px. Financial data uses tabular numerals.
- **Colors:** `src/index.css` contains HSL tokens for page, card, raised surface, text, border, input, focus, and brand colors. Default brand is `hsl(160 68% 70%)`; page is `hsl(210 20% 5%)`. Profit is `#68d9ac`; loss is `#f0848f`. `.light` token overrides are retained as an extension point; no existing theme selector was removed.
- **Spacing:** 4px rhythm; page gutter `clamp(16px, 2.5vw, 40px)`; 64px application header; 232px sidebar, 72px collapsed; 12px panel radius. Dark surfaces use a restrained inset highlight and panel shadow.
- **Controls:** 36px standard buttons, 32px compact, 44px primary marketing/form actions; small icon-based field selectors; consistent keyboard focus, disabled, and destructive states.

Tailwind's legacy zinc/gray utilities resolve through the neutral tokens, allowing supporting components to participate in the same system without changing their data behavior. Reuse `nx-surface`, `nx-page-header`, `nx-tabs`, `nx-toolbar`, and `nx-table`. Removed the unused Vite starter stylesheet `src/App.css`.

## Page and component inventory

| Route/surface                              | Treatment                                                                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                        | Editorial split hero, actual analytics components in a labelled marketing illustration, feature cards, connected workflow, CTA, existing footer links. Pricing stays hidden. |
| `/login`, `/register`                      | Shared split authentication layout, branded editorial panel, consistent form hierarchy. Existing validation and submission preserved.                                        |
| `/dashboard`                               | Refined journal cards, visible delete actions, keyboard-accessible journal opening, existing onboarding and create/delete dialogs.                                           |
| `/journal/:journalId`                      | Journal header, URL-backed tabs, dense search/filter toolbar, risk/PnL unit controls, accessible trade ledger, pagination.                                                   |
| Analytics tab                              | Same metrics, ordering, filters, and calculations; refined KPI typography, donut alignment, chart surfaces, segmented controls and sticky filter position.                   |
| Trade entry/details                        | Existing resizable sheet, date picker, rating, custom fields and screenshots; shared control/surface tokens and clearer sections.                                            |
| Custom fields/settings/import/catalogs     | Shared dialogs, menus, inputs, typography and neutral palette. Actions and data boundaries preserved.                                                                        |
| Unknown route                              | Existing 404 actions inherit the same typography, buttons and tokens.                                                                                                        |
| Legacy Workspace/PerformanceHub components | Inspected; shared shell, table, chart and control tokens apply. They remain outside the current router.                                                                      |

## Accessibility and responsiveness

Mobile sidebar is a dismissible drawer with Escape support, contained keyboard focus, and inert hidden/background content. Expanded/collapsed desktop state still persists. Skip-to-content and visible keyboard focus are provided. Tables scroll horizontally within their container; the table header remains in normal flow to avoid displaced rows. Existing analytics container queries and all data columns remain intact. Reduced-motion rules cover transitions, animations and smooth scrolling.

## Verification

- `npm test`: existing analytical and form invariants.
- `npm run lint`: includes deliberate allowances for shared context/variant exports and fixture-only entries. Existing externally synchronized draft/query effects have narrow, explained lint annotations; calculations are unchanged.
- `npm run build`: production bundle including self-hosted fonts.
- `npm run test:redesign`: launches installed headless Chrome with built-in Node WebSocket/CDP support. Exercises the actual router and components with an isolated synthetic API boundary. It never connects to a live user account. Captures twelve surfaces at verified 1440, 768 and 390px CSS viewports, checks runtime errors, overflow, filters, unit selection, trade/rating dialogs, settings, journal creation and mobile navigation.

Screenshots and machine-readable results are generated under ignored `artifacts/redesign/`. Set `CHROME_PATH` if Chrome is installed elsewhere. Existing Playwright runners remain available when Playwright is installed. No TypeScript/type-check script is configured in this JavaScript repository. Live backend/authentication integration is outside the isolated visual fixture.

### Completed checks

- ESLint completed with zero errors or warnings; all 20 existing unit tests passed.
- Production build succeeded. Vite still reports a large JavaScript chunk (approximately 841kB before gzip); bundle splitting remains a separate optimization.
- All 36 browser cases passed: twelve surfaces at each of 1440, 768 and 390px, with no detected page overflow or runtime errors. Search, status filtering, sorting, unit selection, required form validation, rating mode, settings, journal creation, mobile navigation and desktop/tablet pointer resizing were exercised.
- Rendered screenshots were visually reviewed across landing, authentication, dashboard/onboarding, trades, analytics (including lower charts/calendar), custom fields and dialogs. Horizontally scrollable trade columns are intentional on smaller screens.
- Analytics calculation modules, API modules and schemas have no redesign changes. The backend working tree remains clean after its checkpoint.

These checks use an isolated API adapter and do not establish live authentication, persistence or backend integration correctness. The existing Playwright suite was not run because its dependency is unavailable in this environment; the dependency-free Chrome runner supplies the browser checks above.
