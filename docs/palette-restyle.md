# Colors and typography update

## Foundation

The existing Vite/React application loads its fonts through CSS. `src/index.css` defines the palette and font faces; `tailwind.config.js` exposes them and maps existing gray and semantic color utilities to the new tokens. Components retain their markup, layout classes, dimensions, spacing, and radii.

Added color tokens: `bg-ground`, `bg-card`, `border-hairline`, `border-control`, `surface-active`, `text-primary`, `text-secondary`, `text-tertiary`, `gain`, `loss`, `open`, `neutral`, `chart-neutral`, and `chart-grid`. Existing surface/ink/profit aliases remain compatible. Font variables are `font-sans`, `font-mono`, and `font-ui`.

Geist remains locally hosted through the existing Fontsource dependency. Geist Mono WOFF2 assets and the OFL license are under `src/assets/fonts/`; no dependency or external font request was added. A numeric-only face reuses the same Mono file for digits inside otherwise sans-serif text.

## Component edits

Only paint changes in:

- Analytics: `DonutSection.jsx`, `MonthlyCard.jsx`, and the `heatmapTone` presentation helper in `src/lib/analytics.js`. Data, scale intensity, and metric formulas remain unchanged. Heatmap tint/foreground pairing avoids low-contrast combinations.
- Dashboard charts: `EquityCurveChart.jsx`, `PnlBySetupChart.jsx`, `WinLossChart.jsx`.
- Hub: `AssetBreakdownChart.jsx`, `DrawdownChart.jsx`, `HubEquityCurve.jsx`, `MonthDetailDialog.jsx`, `PerformanceByDayChart.jsx`, `PerformanceByHourChart.jsx`, `PnlByDayChart.jsx`, `ProfitLossDonut.jsx`, `RPerTradeChart.jsx`, `WinLossDistributionChart.jsx`, `WinLossDonut.jsx`.

The equity fill fades through a CSS mask; no SVG definitions or DOM nodes were added. Canvas export resolves its background from the CSS token.

## Deliberate exceptions

Retained existing table typography to preserve intrinsic column widths. Retained calendar header typography to preserve wrapping and arrow positions, and the workflow heading's existing weight/tracking to avoid an extra line. Existing font sizes, line heights, and border widths remain unchanged; no new borders were added to borderless surfaces.

## Verification

Lint, production build, and all 20 existing unit tests pass. No typecheck command is configured. Twelve isolated browser cases cover workspace home, trades, analytics, and landing at 1440/768/390px, plus focused gradient/contrast checks. Enabled text samples meet 4.5:1; disabled controls and decorative graphics are excluded from the automated text audit.

Measured content boxes, chart sizes, padding, radii, and descendant counts match the baseline. The baseline captured two hidden mobile drawers mid-transition; their off-screen translation differs from the settled capture. Source checks confirm unchanged CSS geometry declarations and unchanged JSX syntax apart from paint properties. Live backend integration was not exercised. Artifacts are under ignored `artifacts/palette-*` directories.
