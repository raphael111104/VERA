# Academic writing landing (2026-10-09)

## Content

The landing introduces academic writing through three stages:

1. **Understand the literature** — read key sources, compare perspectives,
   and identify concepts and research gaps.
2. **Examine the evidence** — trace claims to sources, consider methods and
   limitations, and distinguish findings from assumptions.
3. **Write a supported argument** — connect ideas, cite evidence, and revise
   for coherence and academic clarity.

The hero now reads “Start with a question. Write with evidence.” Its
description, source note, navigation, and footer follow this writing focus.
The visible landing contains no development, experiment, or project copy.
Dedicated landing message keys keep these introductions separate from the
workspace's existing functionality. All eight locale catalogs are updated.

## Desktop layout

- The page has an explicit height of `100dvh`.
- The content grid contains the header, a flexible main region, and the footer.
- The main grid divides its available height between the hero and writing
  process panel. Viewport-height-based spacing and typography scale together.
- All three stages remain in one row. A compact height rule adjusts spacing
  and type below 760 px. Mobile layout work was outside this request.
- The supplied logo, square glass card, red brand accent, licensed book
  footage, pause control, and existing entrance/exit motion are retained.
- Reduced-motion preferences still suppress entrances and transitions.
- Landing styles live in `ui/src/vera-landing.css`, imported by
  `ui/src/tailwind.css`. Workspace and splash styles remain in `vera.css`.
- The new stylesheet import also refreshed stale imported CSS in the running
  development preview.

## Browser observations

The English landing was inspected in the running local preview on port 5201.
Both desktop sizes showed the header, complete hero, all three writing cards,
and footer together. Text remained visible within its cards.

| Viewport | Page height | Hero height | Process panel height | Footer bottom |
| --- | ---: | ---: | ---: | ---: |
| 1440 x 900 | 900 px | 440.64 px | 267.05 px | 900 px |
| 1280 x 720 | 720 px | 363.61 px | 220.38 px | 720 px |

At 1440 x 900, the landing's client and scroll heights were both 898 px
(excluding its border). At 1280 x 720, both were 718 px. Each writing card's
scroll height equaled its client height at both sizes. The temporary viewport
override was reset after inspection.

Captures: [1440 x 900](vera-landing-academic.png) and
[1280 x 720](vera-landing-academic-720.png).

## Current contrast refinement (2026-10-09)

The writing process panel returns to solid paper cards. The book backdrop,
translucent fills, inset glass highlights, and backdrop blur have been removed
from the writing card row.

Contrast now comes from the surface hierarchy: the panel uses the warm neutral
`--panel` color, while its three cards use solid white `--base`. Card outlines
mix the existing border and strong-border tokens, left edges use the logo's
primary red, and the connecting rules follow the stronger outline tone.
Card titles use weight 600 to distinguish them from their descriptions.
Corner radius returns to the original 9 px token, with a restrained shadow.

Academic writing content and the desktop `100dvh` grid are preserved. The hero
keeps its original book video and logo glass card. This revision changes only
the writing process presentation. Capture: [solid cards and contrast](vera-landing-contrast.png).

The updated preview was inspected at the comment's 1159 x 668 desktop
viewport. All three solid cards, their text, and the footer were visible in
the same screen. The temporary viewport override was reset afterwards.
Production UI build and style token lint passed, and `ui/dist` was regenerated.
The build log is `target/vera-landing-contrast-build.log`.

## Earlier glass writing cards refinement (2026-10-09, superseded)

All three writing cards used a translucent white gradient, a bright glass
edge, inset highlights, soft depth, and `blur(16px) saturate(110%)` backdrop
filtering. Their corners use the shared 12 px radius. The existing red spine
and stage numbers remain visible, and hovering keeps the glass highlights.

A decorative static frame from the existing licensed book footage sat
behind the card row. A neutral veil keeps it subdued so the transparency and
blur have a visible background while text remains readable. This reuses
`vera-book-poster.webp`; no additional video or generated media is used.

The row backdrop is a CSS pseudo-element and does not alter the grid's
dimensions or accessible content. Browsers without backdrop filtering use
the more opaque existing surface token. The writing content and `100dvh`
layout remain the same.

Implementation: `ui/src/vera-landing.css` and dedicated landing glass tokens
in `ui/src/theme.css`. Capture: [glass writing cards](vera-landing-glass-cards.png).

The updated 1440 x 900 preview showed all three glass cards with readable
text and the full footer inside the viewport. The production UI build and
style token lint passed; `ui/dist` was regenerated. Build log:
`target/vera-landing-glass-cards-build.log`. No new mobile, native window, or
other locale layout run is claimed for this refinement.

## Build scope

The production UI build passed, including localization validation, generated
message functions, TypeScript checking, and Vite packaging. Style token lint
also passed. Generated release assets in `ui/dist` were regenerated from the
final source. The current build log is `target/vera-landing-contrast-build.log`.
Existing CSS `::highlight` and large-chunk warnings remain non-blocking.

No unit or integration suite is added or run for this visual/content revision.
The Windows executable is not rebuilt with this revision. Native window and
other locale layout runs are not claimed.
