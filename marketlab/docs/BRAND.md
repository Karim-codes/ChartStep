# ChartStep identity

## The idea

The name pairs chart reading with learning in manageable steps. The symbol combines an open, geometric **C-shaped chart frame** with **two measured steps** inside it. The frame represents a place to examine evidence; the steps represent a sequence of observations and decisions. There is no arrowhead or claim that the market always rises.

The form was developed as a small vector mark, rather than a decorative illustration. A 32-unit grid, a consistent 3.2-unit stroke, square ends and deliberate gaps keep the frame and steps readable in a navigation rail, app icon or favicon. Its open side also avoids a dense square inside a square.

## Applications

- Main signature: symbol in an 8 px radius blue square beside **ChartStep**, in Inter at weight 650, with restrained negative letter spacing.
- Navigation: white symbol and wordmark on ink, matching the website's dark opening section.
- Paper: blue symbol with an ink wordmark.
- Single-colour: use the complete symbol in ink or white. Do not recolour individual steps.
- Small sizes: use the symbol alone. Keep the standalone mark at least 20 px, and the padded app icon at least 24 px. The favicon uses its own padded 48-unit canvas for rasterisation.

Allow at least five grid units of clear space around the bare symbol. Do not rotate, stretch, add a shadow or introduce a trend arrow. Keep the text as “ChartStep”, with a capital C and S.

## System

| Role | Colour |
| --- | --- |
| Ink / navigation | `#101218` |
| Action blue | `#5966ED` |
| Light blue surface | `#ECEEFF` |
| Public paper | `#F7F6F2` |
| Workspace canvas | `#F6F6F8` |
| Workspace text | `#232631` |

Inter is self-hosted under the SIL Open Font License. Blue denotes navigation, selection and a next action. Green and red remain reserved for chart candles and trading outcomes where direction matters. Light and dark modes share the same hierarchy.

The landing uses editorial space and an interactive chart. The application uses the same typography and mark with a permanent ink navigation rail, denser controls, neutral surfaces and blue focus states. The instrument selector, trading ticket, drawings, positions, lesson panels, journal, library, pricing and settings all follow this system.

## Source and reusable artwork

- React source: `src/components/Brand.tsx`; both public navigation and the workspace use the same geometry.
- Blue symbol: `public/brand/chartstep-symbol.svg`.
- White symbol: `public/brand/chartstep-symbol-white.svg`.
- Favicon: `public/favicon.svg`.
- Application sheet: `docs/brand/chartstep-identity.png`.

This is an original visual direction for this product. Trademark availability and exclusive rights have not been established by a design pass.
