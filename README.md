# moss.ivolopes.com

[![CI](https://github.com/githubdoivo/moss.ivolopes.com/actions/workflows/ci.yml/badge.svg)](https://github.com/githubdoivo/moss.ivolopes.com/actions/workflows/ci.yml)

**MOSS**: DJ and producer. For now, a "soon" page: specimen MOSS-01, a living
bloom drifting in deep space, seen through the curved glass of a visor.

- `assets/plate-*.jpg`: the scene behind the glass (space, planet, asteroids,
  the visor itself), one framing for desktop and one for phones.
- `assets/bloom-*.webp`: the bloom on its own, so it can float, sway and
  breathe, with a green scan passing over it.
- Everything else is live HTML/SVG in `index.html`: the pixel-LCD wordmark,
  the telemetry (sky position, hull, growth, spores), callouts that follow the
  bloom, a waveform pulsing at 124 BPM, and a cursor that scans frequencies
  and locks onto the bloom.

The images were generated as layers edited out of one design mockup, so they
match each other. With "reduce motion" on, nothing moves.

`npm test` runs the Playwright tests; `npm run og` re-renders the link preview.
