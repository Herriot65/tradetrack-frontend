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

## Favorite timeframes

`npm run test:timeframe-favorites` exercises the real trade form: star/unstar
without selecting or submitting, independent Reference/Opportunity/Entry shortcuts,
non-favorite selection, save payload, persistence, cross-tab synchronization,
keyboard selection, actual touch scrolling and 320/390/1280px layout. It also
checks malformed and blocked storage. Use `PLAYWRIGHT_MODULE` as for the other browser runners. Captures are
saved in `artifacts/timeframe-favorites/`.

Favorites are a browser preference scoped to the signed-in user (id, or email
fallback) and field. Each field has its own favorites, ordered by the existing
shortest-to-longest timeframe list. Legacy shared favorites provide an initial
starting point; subsequent changes are stored independently for each field.
No timeframes are preselected or added to the supported list. Preference writes do not modify any trade or backend record.

## Setup options and rating stars

`npm run test:setup-options` covers Manage actions on all Setup fields except
Trade score, custom timeframes/trends/sessions, safe removal of choices without
changing trade values, restoring defaults, persistence and yellow favorite
stars. Mobile touch checks at 320/390px and desktop verify that fractional
rating fills share exactly the same origin and bounds as the original icons.

Timeframes share a choice list; trends and sessions have their own lists.
Choices are saved per signed-in user in this browser. Removing a choice only
hides it from future selection; saved trades keep their original values.
Custom fields use the existing 10/20/50-character timeframe/trend/session limits.
Backend migration `0014_custom_trend_options` removes the fixed trend-choice
restriction so custom trend names round-trip through the API. Existing trend
codes and all financial calculations remain unchanged. Deploy the updated
backend with its migration before using custom trends in a deployed frontend.

## Inline trade image review

`npm run test:image-review` pastes two synthetic chart images into the real notes
editor, checks full-width stacking and original aspect ratios at 320/390/1440px,
and opens the real read-only and editing sheets in Wide review. It verifies
fullscreen keyboard dismissal without closing the underlying trade, and image
removal. Captures live in `artifacts/image-review/`. No live storage is used.

Images now retain their full aspect ratio in notes and read-only trade details;
there is no fixed-height crop or two-column thumbnail grid. Desktop Wide review
expands the existing sheet, while Full screen remains available for inspection.
The image-review layout preserves the original image files. Rich formatting
and persisted size metadata are described in the following section.

## Rich notes and saved image sizes

`npm run test:rich-notes` exercises the actual TipTap toolbar, structured save and
reload, plaintext compatibility, read-only formatted rendering, slider/keyboard/
pointer image resizing, metadata-save failure/retry and mobile wrapping.
Captures are in `artifacts/rich-notes/`. The existing image-review runner also
continues to cover paste, fullscreen, aspect ratios and wide review.

TipTap is loaded only when editing notes. General notes and each review section
support headings 1–3, lists, bold/italic/underline/strike, quotes, colors and undo.
The backend stores versioned JSON in `notes_document`; `notes` retains a plain
text summary for search and older views. Legacy text loads without migration of
its content, and formatted review uses React nodes rather than arbitrary HTML.

Each screenshot stores `display_width` (25–100 percent), while the original
image remains unchanged. Backend migration `0015_rich_notes_and_image_size` must
be applied with the updated API before deploying this frontend. The screenshot
PATCH endpoint is journal/trade scoped and accepts width/section metadata.
No financial formula is changed.

## Sidebar navigation and Overview

`npm run test:navigation` starts the real application with synthetic HTTP responses
at the API boundary. It covers Overview, Journal, Analytics (Performance / Breakdown),
Settings (Account / Custom Fields), legacy deep links, reloads, account switching,
retained filters, the collapsed sidebar and mobile drawer at 320/390/768/1440px.
It checks that Manage → Done leaves the trade open, and that an explicit trade
edit refreshes both Overview and Analytics. No live accounts are used. Screenshots
are saved under `artifacts/navigation/`.

The existing `/journal/:id?tab=...` URLs remain supported. `/dashboard` retains
account creation/selection/deletion; opening an account starts on Overview.
Overview stays focused on four essential KPIs, a compact equity chart, trade
status counts (including open positions) and the five most recent trades,
including open trades. Detailed donut charts stay in Analytics, beside equity
on wide layouts and before equity on narrow layouts. Analytics highlights
Expectancy and Payoff Ratio; Overview shows Net Result, Win Rate, Max Drawdown
and Closed Trades. Overview uses an equity-only chart; the full drawdown chart
remains in Analytics.
All trading calculations use the existing analytics helpers.
No backend migration or new dependency is required.
