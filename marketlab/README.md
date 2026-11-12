# ChartStep

A working, browser-local trading education prototype for CodeRaxa. React 19, TypeScript, Vite and TradingView Lightweight Charts 5.3. No account, API key, backend or payment connection is required.

## Run locally

Requires Node.js 22+ and npm.

```sh
cd marketlab
npm ci
npm run dev
```

Open the URL printed by Vite. The default port is 5173; it selects another port if occupied. The current development session used **http://localhost:5174/**.

```sh
npm test
npm run build
npm run preview
```

Browser tests use an isolated Chromium installation, never the user's browser profile:

```sh
npx playwright install chromium
CHARTSTEP_TEST_URL=http://localhost:5174 npm run test:browser
```

Start `npm run dev` first, or point `CHARTSTEP_TEST_URL` at `npm run preview` to test the production build. Screenshots are saved in `docs/screenshots/`. Native browser control was unavailable in the build session; isolated Playwright tests supplied the browser verification instead.

## What is implemented

- Public landing at `/` with a real interactive chart preview, market tabs, observation feedback, guided-lesson links, working local reflection form, curriculum links and mobile navigation. Academy and paid-plan enquiries use mail links; planned features are labelled.
- Learn home at `/#learn`, three learning pathways, searchable scenario library with concept, pathway, difficulty, type, objective, duration and instrument filters.
- **27 complete playable scenarios across all nine requested categories.** Every scenario has valid deterministic OHLC, instructions, an assessed question, replay, feedback and an educational outcome. Six require chart markings as well as a decision; 13 have a guided lesson format. There are more than eight substantial guided exercises overall. Unbuilt topics appear separately as a curriculum roadmap.
- Actual canvas candlesticks, price/time axes, crosshair and OHLC, zoom, pan, confirmed-swing markers, horizontal levels, price regions and two-point trend lines. Keyboard users can enter prices and choose trend-line endpoint candles. Native chart primitives and price lines keep annotations aligned with chart transformations. Undo, clear and chart reset are available.
- Guided replay with hidden future bars, play/pause, previous/next, speeds, restart and scenario switching. New orders fill from the currently revealed quote only. Feedback is gated until both decision submission and the reveal point. Rewind clears the current assessment, annotations and account and marks the attempt as unscored exploration. Restart after seeing future bars also remains exploration.
- **Continuous synthetic practice:** EUR/USD, GBP/USD, AUD/USD, gold (XAU/USD) and silver (XAG/USD). Local quotes move once per second at 1×, develop the current candle and create a new 15-minute candle every ten ticks. No final bar; history is capped at 600 bars. Every new session uses fresh browser cryptographic randomness for both its initial 40-candle history and future path, independently of the authored lessons. **Fresh market** starts another random session and resets the selected fictional account. This is accelerated fictional time, not a live feed or an actual historical event.
- **$10,000, $50,000 or $100,000** starting balances, remembered locally. Switching balance resets the account; changing market mode resets the account and chart session. This is explained beside the controls.
- Buy/sell positions, additional entries, clear **Sell to close** / **Buy to close** controls, trade price lines, instrument-specific quantity increments, stop/target validation, spreads, slippage, notional reservation, risk estimates, realised/unrealised P&L, balance, equity and closed-trade history. Gold and silver use troy-ounce base quantities, including fractional ounces. Up to five cash-backed positions can be open together in one instrument. Close open positions to switch markets; balance and instrument-tagged closed history are retained. Price drawings reset on a market switch.
- Automatic local recovery of a continuous practice account, positions and drawings. Returning or reloading resumes **paused**, with no execution while away. Explicit session save pauses the market and closes remaining positions before writing a review record.
- Local assessed progress, attempts, revision suggestions, journal form, saved trade sessions, JSON export and reset with an in-app confirmation.
- Whole-application light/dark modes with saved preference; independently selectable chart appearance. Mobile workspace shortcuts. Reduced-motion support, native form labels, keyboard controls and focus-trapped dialogs.
- Planned pricing (£0 demo / provisional £9.99 Student Pro / provisional from £79 Academy), real `mailto:` enquiries and a fictional academy theme preview. All implemented demo features remain available.

## Architecture

| Area | Files |
| --- | --- |
| Presentation and navigation | `src/App.tsx`, `src/styles.css`, `src/workspace-design.css`, `src/components/` |
| Public landing / supplied component integration | `src/components/ui/hero-01.tsx`, `hero-01-utils/`, `demo.tsx` |
| Shared brand geometry | `src/components/Brand.tsx`, `public/brand/` |
| Scenario authoring and pathways | `src/content/scenarios.ts` |
| Typed contracts | `src/engine/types.ts` |
| Deterministic datasets and swings | `src/engine/data.ts` |
| Next-tick synthetic generation | `src/engine/live.ts` |
| Instrument definitions, units and price conventions | `src/engine/instruments.ts` |
| Replay lifecycle and assessment | `src/engine/replay.ts`, `src/engine/assessment.ts` |
| Execution and risk calculations | `src/engine/trading.ts` |
| Local learning/practice persistence | `src/lib/storage.ts`, `src/lib/practice-storage.ts` |
| Product identity, academy, prices and definitions | `src/lib/config.ts`, `src/lib/theme.ts` |

New scenarios are structured configurations, not copied components. Give a scenario a unique ID, category, learning content, deterministic data, initial/reveal positions, options and assessment. Optional `annotation` defines a price band and drawing kind. Instrument-specific precision, units, minimum increments, spread, slippage and volatility are isolated in `src/engine/instruments.ts`. All five supported instruments are USD quoted; no currency conversion or implicit broker lot multiplier is used. See [instrument assumptions](docs/INSTRUMENTS.md).

The product name, owner, contact address and academy identity are configurable in `src/lib/config.ts`. Also update `index.html` metadata when renaming. Set `VITE_CONTACT_EMAIL` before building to use a different enquiry destination. It is a public configuration value, not a secret. No email is collected by the app.

## UI component integration

The supplied `hero-01` composition is implemented in `src/components/ui/hero-01.tsx`; missing header, hero, market strip and preview helpers were completed in `hero-01-utils/`. Its callbacks open the actual learning and trading routes. The demo wrapper is `src/components/ui/demo.tsx`.

Tailwind 4 is configured with the Vite plugin. `components.json`, TypeScript and Vite share the `@/` alias to `src/`; `@/components/ui` is the common location for Button, Sheet, Input, Label and NavigationMenu. Keeping that path consistent makes the supplied imports and future shadcn components resolve predictably. `src/lib/utils.ts` provides `cn`. Radix supplies dialog/menu/label/slot behaviour. Tailwind theme and utility layers are imported without Preflight because the simulator already owns a global reset. Unlayered primitive styles make the integrated components coexist with that reset.

Inter replaces the former fonts across the app. The landing and workspace have their own layout styles but share identity, action blue, focus treatment and theme preference. See [brand rationale and artwork](docs/BRAND.md) and [commercial pilot proposal](docs/COMMERCIAL_PILOT.md). The retained `marketlab.learning.v1` and `marketlab.practice.v1` storage keys preserve progress from the earlier name; they are compatibility identifiers, not visible branding. The checkout folder and existing hosted URL are also retained to preserve links and origin-scoped saved accounts.

## Simulation assumptions

See [SIMULATION.md](docs/SIMULATION.md) for the full contract. This is a simplified, unleveraged directional learning exercise. Both long and short positions reserve full dollar notional. It does not model a real broker's financing, order book, margin or contract execution.

## Verification

`tests/engine.test.ts` validates all 27 datasets, scenario completeness, assessment criteria, no future-derived swings, replay lifecycle, bid/ask entry and exit, units, funds, risk, stops, targets, gaps, slippage, conservative same-candle fills, multiple positions, streaming and account presets. `tests/storage.test.ts` covers persistence, corruption handling, preferences, recovery and migration of existing EUR/USD accounts. `tests/instruments.test.ts` covers each instrument’s USD P&L, quantity steps, notional reservation, spread, slippage, stop/target processing, long-running streams, fresh paths and market-switch guards.

Playwright also fast-forwards continuous practice past candle 66 and covers gold/silver fills, fractional gold shorts, instrument recovery, mixed-instrument trade history and fresh-session paths. It covers the beginner lesson, chart assessment, numeric region drawing, scenario filters, simulated fills, manual closes, history, journal recovery, planned pricing, keyboard controls, mobile shortcuts, multiple positions, continuous quotes, account presets and dark mode. Layouts are checked at **375, 768 and 1440 pixels**, including all seven app areas. The public landing tests also cover preview playback, gold selection, saved reflections, curriculum routing, mobile menu focus/Escape, planned enquiry links and reduced motion. Identity tests check every workspace in both appearances and the phone-to-home navigation. Screenshot artifacts were inspected for mobile, desktop, dark practice and the logo application sheet.

## Demo deployment

This is a static app. Run `npm ci && npm run build`, then serve `dist/` over HTTPS using any static host. Hash routes require no server rewrite configuration. There are no production secrets. Local data is scoped to the deployed origin and browser; it does not migrate automatically from localhost.

Sites configuration is in `.openai/hosting.json`. Reuse its existing project ID; do not register another Site. Push source and package the matching `dist/` output with the Sites source workflow, then save/deploy the same commit and archive. New Sites default to owner-private; sharing with an academy is a separate audience decision. A host sign-in gate is infrastructure access, not application authentication.

## Known limits and next steps

- All prices are synthetic. The stream is a bounded random walk with instrument-specific configured volatility, not a model validated against real market microstructure. No live data, real money, broker connectivity, investment advice or guaranteed results.
- All authored guided exercises use EUR/USD and a fixed 15-minute interval. The lesson-library instrument filter therefore lists EUR/USD; **Virtual trading** has a separate **Practice market** selector for five supported instruments. Metals are base-ounce directional simulations, not leveraged CFDs or exchange futures contracts. Non-USD quote currencies, multi-instrument concurrent positions and FX conversion are not implemented.
- The roadmap is not playable content. Methods for market structure and liquidity differ among educators. Obtain qualified curriculum review and test the learning experience with real beginners.
- Account recovery and progress are browser-local. No cross-device sync, login, backup service or production anti-cheat system. Exports contain records; import is not implemented. Active continuous practice resumes paused. Guided replay is session-local.
- Drawings are level, price-region and trend-line tools; there is no full TradingView drawing suite, drag-to-modify order levels or arbitrary intrabar rewind. Old trend anchors outside the retained 600 bars no longer display.
- No commissions, swap/interest, variable spreads within a scenario, latency, leverage or margin calls. Presets change fictional starting capital, not buying power multipliers. See the documented execution limitations.
- No billing, authentication, subscriptions, access enforcement, instructor authoring backend, multi-tenant academy isolation, assignments or mentor messaging. These are explicitly future functionality.
- Check the configurable contact address before sharing. A `mailto:` enquiry needs the visitor's email app and does not send or store anything by itself.
- Chromium is covered; Safari, Firefox, real touchscreen devices and screen-reader user testing remain for a wider pilot. Automated coverage does not replace educator review or usability studies.
- Before paid SaaS work: validate the learning loop with an academy, review curriculum/licences/financial communications, add secure server-side identity and tenant isolation, design authoring/review/versioning, then implement audited billing and entitlements after explicit approval.

## Research and attribution

[Product and design audit](docs/PRODUCT_AUDIT.md) records the reference review and design decisions. Lightweight Charts is Apache 2.0; the visible attribution logo and TradingView link remain enabled. The library licence and NOTICE ship in `public/licenses/lightweight-charts/`. See [third-party notices](docs/THIRD_PARTY_NOTICES.md).
