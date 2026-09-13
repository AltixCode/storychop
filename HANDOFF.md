# AGENT WORK TRACKING & HANDOFF STATE

## Current Status: CORE_VERIFIED_IOS — store assets and Android pass outstanding

## Last Updated: 2026-09-13T16:05:00+03:00

## What was wrong

`src/services/ffmpeg.ts` built an ffmpeg command string, never ran it, and
called `FileSystem.copyAsync` on the whole source once per segment. Every
"clip" was a full-length copy of the original video; the timeline selection had
no effect on the output. The app also could not launch on iOS 26/27.

## What is now true

* `modules/video-trimmer` performs real cuts: `AVAssetExportSession` in
  passthrough mode on iOS, `MediaExtractor`/`MediaMuxer` on Android. Samples are
  copied, not re-encoded, so the trim is fast and lossless.
  `ffmpeg-kit-react-native` was retired in 2025 and its binaries delisted.
* The module reports the duration **actually written**, not the requested range,
  because passthrough can only cut on sync samples. The completion screen shows
  those real per-clip lengths, so a regression to full-length copies would be
  visible to the user rather than hidden behind a progress bar.

## Verification performed (iPhone 18 Pro, iOS 27, Release build)

Fixture: `scripts/make-fixture.swift` renders a 95s clip with a distinct colour
and number per second, so a wrong start offset is visible in the output.

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| Release build + install | PASS |
| Launch to first frame | PASS |
| `.maestro/split-flow.yaml` end to end | PASS |
| Segmentation of 95s at 30s preset | PASS — 4 parts: 0:00-0:30, 0:30-1:00, 1:00-1:30, 1:30-1:35 |
| **Written clip durations** | **PASS — 30.00s, 30.00s, 30.00s, 5.00s** |

Reproduce with `swift scripts/verify-clip-durations.swift <files>`. A regression
to the old behaviour shows four 95.00s entries.

## Defects found and fixed during verification

1. `expo-media-library`'s root export **throws** on `saveToLibraryAsync` in SDK
   57, so no clip could ever reach the camera roll. Now imports from
   `expo-media-library/legacy`. The same defect was present in `packpixel` and
   `redactpro`, where it failed silently inside a `catch`.
2. The PRO header action was inherited by the paywall route, which could then
   open a copy of itself without limit.
3. `space-x-*`/`space-y-*` and `bg-gradient-*` render as nothing in React
   Native; spacing and the paywall gradient were absent.

## Known issues

* **Pluralisation**: the export button reads "Export 1 Clips" for a single
  clip. Needs plural-aware keys before the localisation pass — `ru` has three
  forms and `ar` has six.

## Outstanding

* Android emulator pass: NOT RUN.
* Store listing, screenshots, icon, keywords: NOT DONE.
* IAP `storychop_pro_lifetime` exists, priced $6.99, state `MISSING_METADATA`
  pending the App Review paywall screenshot.
* Purchase/restore against a StoreKit configuration: NOT RUN.
