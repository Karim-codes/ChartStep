# ChartStep: product and design audit

Research completed before implementation, 12 November 2026. The repository contained only an empty Git checkout; there was no existing simulator to preserve. Public product pages and documentation were reviewed, not paid accounts or authenticated application screens.

| Reference | Observed strength | Our design inference for beginners |
| --- | --- | --- |
| [FX Replay help](https://support.fxreplay.com/articles/tracking-your-trades-with-the-journal-feature) | Replay sessions, execution and structured trade notes form a useful review loop. Homepage returned 403; public help was accessible. | Start with a question and a short explanation before exposing order entry. Keep notes close to practice. |
| [TradingView Bar Replay](https://www.tradingview.com/support/solutions/43000474024-how-do-i-turn-bar-replay-on/) | Familiar playback, variable speed, drawings and replay start selection. Its documented live quotes/order limitations matter. | Provide a smaller toolset, obvious synthetic quotes and an execution engine driven exclusively by revealed candles. |
| [TradeZella](https://www.tradezella.com/) | Journaling, backtesting, replay and mentor spaces connect practice with review. | Review the reasoning and risk plan, not just the financial outcome. Academy collaboration belongs on the roadmap. |
| [BabyPips](https://www.babypips.com/learn/forex) | Structured beginner progression, definitions and quizzes. | Short pathways with an immediate visual exercise reduce the distance between reading and doing. |
| [Brilliant](https://brilliant.org/) | Visual guided questions, feedback and progress-based revision. The current public site foregrounds its interactive tutor. | Ask one question at a time, offer actionable feedback and repeat exercises without a penalty. No invented AI tutor. |
| [Lightweight Charts](https://tradingview.github.io/lightweight-charts/docs) | Canvas candlesticks, time/price scales, coordinate APIs, markers and custom primitives. Current docs identify v5.3. | Use the installed v5 API. Native price lines and a series primitive keep drawings aligned through transforms. Ship Apache 2.0 licence/NOTICE and a visible TradingView link/logo. |

## Direction

A quiet learning studio: warm off-white canvas, deep forest green, pale lime emphasis, charcoal text, subtle borders and generous readable type. A persistent left navigation on desktop becomes a compact mobile navigation. A useful next lesson dominates the home screen; progress is real and initially zero. Small charts explain pathways rather than decorate empty analytics. No leaderboards, fictional win rates, streak pressure or casino effects.

## Implementation decisions

- React + TypeScript + Vite, with hand-authored accessible CSS and Lucide icons. No backend, accounts, billing, deposits or external data feed.
- Separate typed scenario authoring, deterministic OHLC generation, assessment, replay reducer, order engine, persistence, brand and pricing configuration.
- 27 authored scenarios across all nine requested categories. Every scenario has data, question, objective, explanation and outcome; guided annotations and decisions share a reusable engine.
- Only the revealed prefix enters chart data and calculations. Assessment feedback is withheld until a submitted decision and a defined reveal point. Rewind resets the current attempt and orders, and marks that run as exploration.
- Fictional USD account, synthetic EUR/USD only, explicit fixed spread, unleveraged notional reservation, conservative stop processing and adverse gap/slippage handling. Document assumptions and unit-test them.
- Progress, saved sessions and journals use versioned local storage with defensive loading. Explain storage loss and provide reset/export.
- Planned pricing and an academy theme are previews. All demo exercises remain open. An email link opens the visitor's mail application and does not claim to collect data.

## Limits to validate in a commercial pilot

Teaching efficacy, scenario realism, accessibility with real students, curriculum review, licences, financial communications and regulatory review. Synthetic outcomes are not evidence of trading profitability.
