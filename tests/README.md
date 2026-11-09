# Analytics verification

Run `npm test` for deterministic formula, filter-reconciliation, calendar, donut, heatmap, formatting and DST tests. Fixtures are explicitly synthetic: the repository does not contain the user's saved 126-trade, +96.52R snapshot. That exact snapshot must be checked against the saved journal rather than manufactured from the expected totals.

Run `npm run test:browser` with Playwright installed and Chrome available. Alternatively set `PLAYWRIGHT_MODULE` to an existing Playwright `index.mjs`. The runner starts and stops its own Vite server, mounts the real AnalyticsTab and useJournalAnalytics selector, and supplies a deterministic Axios adapter. It never reads or changes a live journal.

Browser assertions cover KPI/legend text, date and asset filters, multi-year monthly visibility, calendar navigation bounds and trade links, keyboard donut/crosshair/heatmap readouts, sequence/distribution switching, empty results/reset, and responsive layout at 17 widths from 320px to 2560px. The width matrix reserves space for the journal sidebar, checks clipping inside cards as well as page overflow, and verifies container-based column counts. Landscape/short viewports and mobile touch input cover donut selection, distribution controls, calendar popovers and pinned heatmap labels. Screenshots are saved under `artifacts/analytics/` (gitignored).

The requested Net row in the profit/loss donut and totals in the asset table intentionally repeat their corresponding aggregate values. Redundant standalone KPI cards and KPI sub-lines were removed. Literal uniqueness of every number would conflict with those specified rows and with coincidentally equal values.

Session bands use Tokyo 09:00-18:00, London 08:00-17:00 and New York 08:00-17:00 local times, converted with Intl DST offsets. Since a multi-month range may span DST changes, the band reference date is shown. The app has no stored timezone setting; analytics currently follows the browser's display timezone.

Still requires live-journal confirmation: the exact supplied sample snapshot, authenticated backend responses and persisted user settings. Browser tests isolate the frontend/API-response boundary; they do not exercise a live Django database. Human review of the full journal shell with realistic trade density is still useful.

## Trade form

`npm test` also checks optional integer scores (0-10), valid reference timeframe payloads, UTC date conversion, precision preservation and exit-after-entry validation. Run `npm run test:trade-browser` to exercise the real TradePanel with its Axios boundary stubbed: create/edit/clear score and reference values, calendar month/day selection, time dropdowns, zero P&L, and narrow/mobile layouts at 320, 390, 768 and 1280px. The browser runs in America/New_York while stored timestamps remain UTC. Screenshots are saved under `artifacts/trade-form/`.

Trade dates use React DayPicker 9 with Radix popovers; fixed-choice form fields and calendar/time menus use Radix Select. Backend migration 0009 adds nullable reference_timeframe and trade_score columns, and an integer 0-10 database constraint. Rebuild both Docker services to install dependencies and apply the migration automatically.

## Theme preferences

Theme choices are stored only in this browser; System is the default. Signing in, signing out and saving account settings preserve this choice. The existing backend theme field is retained for compatibility but is no longer used by the frontend.

`npm run test:theme` builds and checks the real app with stubbed API responses: pre-login selection, login/session/logout persistence, zero theme API writes, live System updates, actual cross-tab synchronization, invalid preferences and blocked theme storage. It also checks the landing, login, registration and dashboard layouts from 320px to 1440px in English and French. Use `PLAYWRIGHT_MODULE` to select an installed Playwright module and `CHROMIUM_PATH` to select Chromium when needed. Screenshots are saved under `artifacts/theme/`.

## Custom fields and the trades list

`npm run test:custom-fields` verifies creation below all six form sections, journal-level definition reuse, per-trade values (including 0 and false), reload persistence, and the 320px field-builder layout. Adding a definition must not submit the parent trade form. Text, number, dropdown and yes/no types are supported. Definitions live at `/journals/:id/custom-fields/`; values live in each trade's `custom_fields` object. Migration 0010 adds the model and JSON storage.

`npm run test:trades-list` checks server-scoped status/search filters and pagination against 65 trades, including matches outside the original page; global sorting; and one debounced request for a six-character asset search. The input retains focus and the existing table stays mounted while results update. Django API tests independently verify filtering before pagination, the journal BE rule/manual overrides, type validation, journal ownership and definition uniqueness.

## Language selection

The header and sign-in pages offer Français (FR) and English (US). English is the default. The choice is stored in `nexora_language` in browser storage and synchronized across tabs. Interface translations live in `src/i18n/fr.js`; user-entered journal names, notes, tags, and custom field options retain their original text. Dates and numbers follow the selected locale; trade timestamps retain their existing timezone behavior.

`npm test` includes translation, interpolation, locale formatting, invalid-language, and unavailable-storage checks. `npm run test:language` builds the app and verifies switching, navigation/reload persistence, form preservation, French validation, settings, cross-tab synchronization, and layouts from 320px through 1280px. Set `PLAYWRIGHT_MODULE` to an installed Playwright entry point and `CHROMIUM_PATH` to a browser executable when needed. API calls in browser tests are stubbed.

## Tab loading

Run `npm run test:tab-loading` (with `PLAYWRIGHT_MODULE` when needed) to verify that hiding and reopening a loaded tab performs no extra reads, while edits, journal changes, explicit refresh and failed-request recovery fetch fresh results. The analytics browser fixture also tests compact history records and loading complete notes when opening trade details.

History requests use `compact=1&page_size=1000`; older backends can still return their normal representation and page cap. Updated backends omit notes, screenshots and custom field values from this representation and preserve all analytic inputs. Full trade details continue to use the existing detail endpoint. The history pages remain bounded to 1,000 records, while regular list requests retain the 100-record maximum.

## Latency measurements

`tests/tab-latency-benchmark.mjs` compares production builds using the real journal page, 126 synthetic trades and a controlled 150 ms API delay. Build main into `/tmp/tradetrack-latency-baseline-dist`, build the current branch with `npm run build`, then run `PLAYWRIGHT_MODULE=/workspace/.tradetrack/playwright.mjs node tests/tab-latency-benchmark.mjs`. It writes raw results to `artifacts/latency/tab-latency.json`; optional environment variables are `BENCH_TRADES`, `BENCH_ROUNDS`, and `BENCH_API_DELAY_MS`. The main baseline build must match the previous server's 100-record cap. The script also verifies direct authenticated journal loading while journal metadata is still loading.

For real local backend timings excluding network, run `DATABASE_URL=sqlite:////tmp/tradetrack-benchmark.sqlite3 /workspace/.tradetrack/venv/bin/python -m pytest -q -s tests/benchmark_history.py` from the backend. The benchmark uses an isolated pytest database, alternates full/compact requests, and writes `artifacts/latency/backend-latency.json` in the frontend checkout. Production latency requires a deployed URL and authorized session.

## Currency selection and scrolling

Run `npm run test:currency-scroll` with `PLAYWRIGHT_MODULE` as needed. The dense synthetic fixture toggles R, dollars and percent while scrolling down and back up at widths 320, 390, 768, 1280 and 1920. Assertions check the selected unit and KPI output, exactly one KPI block with four main values, no filter/KPI intersections, no report-section intersections and no horizontal overflow. Screenshots are saved under `artifacts/currency-scroll/`. The filter toolbar stays in normal document flow so it cannot cover the KPI cards while scrolling.
