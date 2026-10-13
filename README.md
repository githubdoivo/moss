# moss.ivolopes.com

[![CI](https://github.com/githubdoivo/moss/actions/workflows/ci.yml/badge.svg)](https://github.com/githubdoivo/moss/actions/workflows/ci.yml)

**MOSS**: DJ and producer. For now, a "soon" page styled as a botanical
specimen scan in a green-phosphor terminal:

- `specimen.js` grows specimen MOSS-01 live on a canvas: a pale, glazed,
  ceramic-like bloom opens, fuzzy moss cushions creep around it, ferns
  unfurl and small white flowers open, with a scan line sweeping over it.
- `hud.js` runs the terminal around it: live growth log (moss coverage counts
  up as it grows), telemetry feed, a 124 BPM gauge, a generated swamp survey
  map, a spectrum, and a reticle that tracks the pointer with coordinates.
- Film grain, scanlines and a vignette in CSS. No libraries.

With "reduce motion" on, the specimen is drawn once, fully grown.

`npm test` runs the Playwright tests; `npm run og` re-renders the link preview.
