# Workspace header options (2026-10-09)

The request is to explore ways to fill the empty right side of the application
header. Before this change, `VeraAppHeader` rendered the brand and an optional
children slot, while its call in `App.tsx` supplied no children.
Workspace-specific tools are in the separate toolbar below.

## Selected implementation — C

The user selected option C. The application now renders workspace context in
the right side of `VeraAppHeader` through `VeraWorkContext`:

- The secondary line identifies the current workspace.
- The primary line displays the active chat's title from the existing session
  query. It follows navigation and session title changes through the shared
  query cache.
- A small outlined document icon uses the theme's red accent.
- Long labels and titles truncate in place, with full text in native title
  tooltips. Logical spacing and theme tokens preserve RTL and dark themes.
- New chats show the existing localized "New Chat" label; unnamed chats show
  "Untitled". Loading and unavailable sessions use the corresponding existing
  messages. Settings and Skills show their view label rather than a remembered
  chat title.

The source changes are in `ui/src/components/Header.tsx`, `ui/src/App.tsx`,
`ui/src/vera.css`, and the eight message catalogs. The original alternatives
below record the design exploration that preceded this implementation.

### Build and visual inspection

- `pnpm build` in `ui/` succeeded, including catalog lint, Paraglide generation,
  route generation, TypeScript, and Vite production assets in `ui/dist`.
- `node ui/scripts/check-styles.mjs` succeeded.
- The live demo workspace shows `Current work · nanochat (demo)` above
  `Visualize Nanochat Training Results`. The saved screenshot is
  [the implemented header in context](vera-header-context.png).
- No automated test suite was run. Settings, empty, and long-title states are
  handled in source but were not exercised through browser navigation.
- Build warnings remain for the existing route-generator circular dependency,
  CSS `::highlight` processing, and large output chunks.

## Visual alternatives explored

| Option | Right-side content | Purpose | Implementation considerations |
| --- | --- | --- | --- |
| A — Academic editorial | Literature / Evidence / Writing; an italic evidence-writing signature and fine red rule | Add academic identity and balance | Static content; no new feature or data dependency |
| B — Global utilities | Home, Help, Settings | Add useful global access | Reuse landing navigation, existing help/demo dialog, and settings navigation; help/demo is not a dedicated academic writing guide |
| C — Work context | Active workspace name and task title | Show orientation while switching work | Use existing project/task metadata; handle empty and long titles; duplicates some context already in the main panel |

Option B is the default recommendation for utility. Option A suits a primarily
visual refinement. None of the variants changes the workspace toolbar or
introduces research progress or evidence quality indicators.

## Reviewable prototype

Interactive preview: `http://127.0.0.1:5201/design-previews/header-options.html`.
Source: `ui/design-previews/header-options.html`.
The stage uses a screenshot of the current demo workspace as context:
`ui/design-previews/header-reference.png`. Only the header is overlaid.

The A/B/C controls change the visual variant and its explanation. Header
actions display implementation notes inside the prototype; they are not
connected to the application's state or navigation. The application header
source is not edited by this exploration.

The preview lives outside `src` and `public`, and is not a configured Vite
production entry. It is a design artifact, not a released feature.

All three variants were visually inspected in the running preview. Captures
show the proposed header together with the existing workspace toolbar:

- [A — Editorial](vera-header-option-a.png)
- [B — Global utilities](vera-header-option-b.png)
- [C — Work context](vera-header-option-c.png)
- [Interactive preview overview](vera-header-options-overview.png)

The original preview was left on option B. At the time of the design
exploration, application code and production entry points were unchanged, so
no application build or test suite was run for that exploration.

Reference for global utility placement:
[Carbon UI shell header guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/ui-shell-header/guidelines).
