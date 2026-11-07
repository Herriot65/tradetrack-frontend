# Font assets

The active UI uses the same self-hosted Inter variable assets as the preserved
redesign branch. Latin and Latin Extended WOFF2, weights 100–900, sourced from
`@fontsource-variable/inter` 5.3.0. License: `INTER-LICENSE.txt` (SIL OFL 1.1).
No remote font requests or new runtime dependencies.

Legacy Geist Mono files and `OFL.txt` remain for provenance. They are no longer
loaded by the active stylesheet. This branch changes font family only; existing
font sizes, weights, colors, spacing and card styles are retained from main.
