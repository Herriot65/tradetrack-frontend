# Analytics verification

Run `npm test` for deterministic formula, filter-reconciliation, calendar, donut, heatmap, formatting and DST tests. Fixtures are explicitly synthetic: the repository does not contain the user's saved 126-trade, +96.52R snapshot. That exact snapshot must be checked against the saved journal rather than manufactured from the expected totals.

Run `npm run test:browser` with Playwright installed and Chrome available. Alternatively set `PLAYWRIGHT_MODULE` to an existing Playwright `index.mjs`. The runner starts and stops its own Vite server, mounts the real AnalyticsTab and useJournalAnalytics selector, and supplies a deterministic Axios adapter. It never reads or changes a live journal.

Browser assertions cover KPI/legend text, date and asset filters, multi-year monthly visibility, calendar navigation bounds and trade links, keyboard donut/crosshair/heatmap readouts, sequence/distribution switching, empty results/reset, and responsive layout at 17 widths from 320px to 2560px. The width matrix reserves space for the journal sidebar, checks clipping inside cards as well as page overflow, and verifies container-based column counts. Landscape/short viewports and mobile touch input cover donut selection, distribution controls, calendar popovers and pinned heatmap labels. Screenshots are saved under `artifacts/analytics/` (gitignored).

The requested Net row in the profit/loss donut and totals in the asset table intentionally repeat their corresponding aggregate values. Redundant standalone KPI cards and KPI sub-lines were removed. Literal uniqueness of every number would conflict with those specified rows and with coincidentally equal values.

Session bands use Tokyo 09:00-18:00, London 08:00-17:00 and New York 08:00-17:00 local times, converted with Intl DST offsets. Since a multi-month range may span DST changes, the band reference date is shown. The app has no stored timezone setting; analytics currently follows the browser's display timezone.

Still requires live-journal confirmation: the exact supplied sample snapshot, authenticated backend responses and persisted user settings. Browser tests isolate the frontend/API-response boundary; they do not exercise a live Django database. Human review of the full journal shell with realistic trade density is still useful.
