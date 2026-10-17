# Fanta Grape — scroll experience

Independent creative concept, using original illustrated packaging rather than an official product render. No affiliation with The Coca-Cola Company.

## Run

Requires Node.js 18 or newer. Run `npm run dev` and open http://localhost:4173. The site itself has no runtime dependencies. Google Fonts is optional; system fonts are used when unavailable.

## Interaction

Scroll the pinned scene forward or backward to control the can tilt, connected liquid stream, rising wave, three flavour messages, and final splash. Numbered chapter controls jump to each part. The final CTA opens product details and serving ideas. Serving ideas support mouse, touch, and arrow-key navigation. Reduced-motion settings show a static hero and keep the content directly accessible; a footer control also switches modes.

## Implementation

- `index.html`: semantic content and original vector product illustration.
- `styles.css`: purple campaign art direction and responsive layouts.
- `main.js`: viewport-anchored SVG liquid rendering, native scroll scrubbing, tabs and dialog.
- `can-details.mjs`: cylindrical lighting, polished aluminum lid and rims, and layered condensation beads.
- `scene-math.mjs`: deterministic reversible timeline calculations.
- `server.mjs`: dependency-free local preview server.

The fluid effect is an art-directed SVG illusion, not a physical fluid simulation. Native sticky positioning and animation-frame updates avoid a framework or animation-library download. The stream is recalculated from the transformed can opening, keeping it attached through tilt, scroll reversal and resizing. No JavaScript animation loop runs while the page is idle. Lightweight CSS animations provide rising microbubbles, opening fizz and subtle reflection changes; these pause offscreen and in hidden tabs, and respect reduced-motion settings. Mobile uses fewer visible bubbles.

## Verification

`npm test` checks timeline bounds, ordering and reversibility. For browser checks: `npm install`, `npx playwright install chromium`, then start `npm run dev` and run `npm run test:browser`. Browser tests cover desktop/mobile scrolling, stream alignment, reversal, chapter content, CTA, tabs, resize and reduced motion. Screenshots are written to `test-results/`.
