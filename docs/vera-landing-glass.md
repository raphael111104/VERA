# VERA landing refinement (2026-10-09)

## Requested changes

- Removed both the identity card header (VERA / Research desk) and its caption
  (Veritas Evidence & Research Agent).
- Changed the identity card to a centered square, up to 360 x 360 px on desktop
  and up to 280 x 280 px on narrow layouts. The transparent supplied logo is
  the only content in the card.
- Added translucent glass fill, a white edge, soft shadow, and 18 px backdrop
  blur. The video remains visible through the card. The fill and edge provide
  a usable fallback where backdrop filtering is unavailable.
- Reduced the hero's type scale and padding to bring the research workflow
  farther into the opening viewport.
- Added a fine red page edge, a header underline, and a bordered header action.
- Reframed the workflow as a paper panel with a serif heading, large stage
  numbers, connecting rules, relevant icons, subtle paper depth, and restrained
  hover movement. Informational stages remain non-interactive list items.
- Added the compact brand mark and a serif signature to the footer.

The existing content, supplied logo, licensed Mixkit footage, primary red
`#e20105`, startup sequence, and workspace actions are retained. Reduced-motion
rules suppress the new hover transitions along with the existing entrances.

## Implementation and checks

- Main layout: `ui/src/components/VeraLandingPage.tsx`.
- Landing styles: `ui/src/vera.css`; new glass and paper tokens are in
  `ui/src/theme.css`.
- Production UI build passed, including localization and TypeScript checks;
  `ui/dist` was regenerated. Existing CSS `::highlight` and chunk-size warnings
  remain.
- Style token lint passed. No unit or integration test suite was run for this
  visual refinement.
- The local preview displayed a 360 x 360 px card with an aspect ratio of 1:1,
  translucent gradient, and active backdrop blur. The removed header and
  caption are absent from the page.
- The workflow anchor was inspected through the footer at the normal browser
  viewport. Preview captures: `vera-landing-glass-hero.png` and
  `vera-landing-glass-workflow.png`.
- The CSS import entry comment was updated to invalidate the development
  server's stale imported styles. Both the preview and production bundle use
  the current visual rules.
- Narrow layout rules were updated in source; no new viewport override or
  mobile browser run is claimed for this revision.
- The Windows executable has not been rebuilt with this revision.
