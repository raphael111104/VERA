# VERA hero footage (2026-10-09)

The landing hero uses real macro footage of an open book from Mixkit. This
replaces the illustrated research-desk loop. The supplied VERA logo remains
the foreground identity; a light gradient protects the headline and body text.

## Source and license

- Title: **Close tour through the middle of an open book**, item 42926.
- Provider/contributor: Mixkit, as listed on the asset page.
- [Original source and Full HD download](https://mixkit.co/free-stock-video/close-tour-through-the-middle-of-an-open-book-42926/).
- [Mixkit Stock Video Free License](https://mixkit.co/license/#videoFree),
  checked on 2026-10-09. The asset page explicitly assigns the Free License.
  The license permits commercial and non-commercial projects and modification;
  attribution is optional. Its User Terms still apply.
- This is licensed stock footage, not CC0 or generated media. The media license
  is separate from the software license for the repository.
- Source SHA-256:
  `77a5b51143440f52bee23d8c82e729ab7a202cb78fb4e512989cad642aa89e7d`.

Provenance, transformation details, byte sizes, and asset hashes are included
in `ui/public/vera-hero-source.json`, which is copied into the production bundle.

## Preparation and assets

`scripts/prepare-vera-hero.py` processes the downloaded Full HD source:

```text
python scripts/prepare-vera-hero.py /path/to/mixkit-42926-full-hd.mp4
```

It requires ffmpeg or imageio-ffmpeg. The local imageio-ffmpeg installation may
be placed in `target/vera-video-tools`. No new npm runtime dependency is needed.

The source is trimmed to 0.3-5.3 seconds, slowed to two-thirds speed, and joined
to its reverse camera pan for a continuous return path. Only the camera moves;
there are no reversed human actions. Neutral color adjustments keep it compatible
with VERA's warm light palette. No AI image or video generation is used.

- `ui/public/vera-book-loop.mp4`: silent H.264 Main, 1280 x 720, 24 fps,
  approximately 14.8 seconds, 1,811,389 bytes, fast-start metadata.
- `ui/public/vera-book-poster.webp`: poster extracted from the footage,
  12,082 bytes.
- `--brand-red: #e20105` continues to match the supplied logo.
- The old generated assets and renderer are archived locally under
  `target/vera-hero-generated-backup`; they are excluded from the active UI assets.

## Playback and packaging

`HeroBackdrop.tsx` retains a localized pause/play control, offscreen and hidden
page pause, and the reduced-motion default. A loading error leaves the poster.
The current development preview uses the new stock footage. The production UI
bundle is regenerated for this revision. The Windows executable has not been
rebuilt with this stock footage.

## Revision checks

- `pnpm build` passed, including localization and TypeScript checks. Existing
  CSS `::highlight` and large-chunk warnings remain. `ui/dist` contains the new
  stock footage, poster, provenance manifest, and media license note.
- The MP4 decoded successfully; the browser reported 1280 x 720, 14.833333
  seconds, readyState 4, muted, looping, and playing.
- Browser inspection confirmed the real footage and readable foreground in
  the landing hero. Screenshot: `vera-hero-stock-footage.png`.
- Video, poster, and provenance manifest hashes match between public and dist.
- No new UI test suite run is claimed for this footage replacement; the
  preceding video revision had 224 passing tests. Existing playback controls,
  reduced-motion handling, and offscreen behavior are retained in source.
