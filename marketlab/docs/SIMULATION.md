# Simulation and assessment contract

This software is an educational simulation. All balances, prices, trades and outcomes are fictional. There are no deposits, real orders, broker connections or financial advice. Simulated results do not predict future performance. Trading and leveraged financial products carry significant risks.

## Data and market modes

Guided-lesson OHLC are synthetic EUR/USD **mid-prices**, rounded to five decimals. Continuous practice supports EUR/USD, GBP/USD and AUD/USD at five decimals, gold XAU/USD at two decimals, and silver XAG/USD at three decimals. Each is quoted in USD per base unit. Time values are Unix seconds in ascending order, spaced 900 seconds apart for 15-minute candles. Every candle satisfies `low <= min(open, close) <= max(open, close) <= high`. Scenarios are reproducible from fixed seeds and intentionally authored anchors and pattern patches. Synthetic gaps are labelled as such.

Guided replay supplies only `candles.slice(0, index + 1)` to chart rendering, visible swing detection, quotes, execution and OHLC tooltips. Feedback is withheld until a submitted decision and a configured reveal index. No future autoscale series or future markers are attached. Future arrays and answers do exist in the JavaScript bundle because this is an offline-capable client prototype; this is not a secure examination or server-side anti-cheat system.

Continuous practice generates its own 40-candle initial history, then generates **only the next quote** through an integer PRNG, changing smooth regimes and bounded mean reversion. Production startup, a new market selection, and Fresh market/New market session supply a new 32-bit seed from `crypto.getRandomValues`; the lesson dataset is never used as a free-practice price path. Injected seeds let tests reproduce a session exactly. Saved accounts retain their evolving seed and market state, so recovery does not rewrite observed prices or outcomes. Fresh market resets the account as labelled. Guided lessons intentionally retain their deterministic datasets for review. One real second at 1× advances 90 fictional seconds. Ten ticks form a new 15-minute candle. Prices are bounded to positive plausible exercise values; only the last 600 candles are retained. There is no claim that this process recreates a real market's distribution. Streaming pauses when the workspace is unmounted, and saved practice resumes paused rather than processing invisible moves.

## Execution

- Currency: USD account. `notional USD = base quantity × entry price`. Forex uses EUR, GBP or AUD base units in whole-unit increments. Gold uses troy ounces in 0.01 oz increments; silver uses troy ounces in 0.1 oz increments. There is no implicit lot/contract multiplier and no quote-currency conversion. All amounts are fictional. The default account is $10,000; $50,000 and $100,000 are alternative fictional presets.
- Both long and short exercises reserve their full USD entry notional. Balance is a realised ledger, not a wallet debit on each fill. Reserved funds are unavailable for additional orders. `available = max(0, balance + min(0, unrealised P&L) - reserved notional)`. Unrealised gains do not expand purchasing power.
- This cash-backed directional reservation for shorts is a deliberate teaching simplification. It does not model actual spot borrowing, derivatives or financing.
- Default fixed spread: 0.00012, or 1.2 pips. The wide-spread scenario uses 0.00040, or 4 pips. A EUR/USD pip is 0.0001.
- `bid = mid - spread/2`; `ask = mid + spread/2`. A buy opens at ask and closes at bid. A sell opens at bid and closes at ask. Manual closes execute at the current revealed quote. A newly opened 1,000-unit position at a 1.2 pip spread starts with an unrealised loss of $0.12.
- USD P&L: buys `(exit - entry) × units`; sells `(entry - exit) × units`. No fabricated P&L and no win-rate scoring. Balance increments by realised P&L when a position closes. Equity is balance plus total unrealised P&L. Ledger amounts are retained to six decimal places and displayed to two.
- Buy stop must be below the current bid, and target above the ask entry. Sell stop must be above current ask, target below bid entry. Reject nonfinite inputs, nonpositive prices, quantities below the instrument minimum or off its quantity step, more than 1,000,000 base units, insufficient notional funds and more than five simultaneous positions. Forex units must be whole; fractional gold/silver ounces are allowed at their documented increments.
- Estimated stop risk is `abs(entry - stop) × quantity + instrument slippage × quantity`. EUR/USD uses 0.00002, GBP/USD 0.00003, AUD/USD 0.00002, gold $0.05/oz and silver $0.005/oz adverse stop slippage. Reward uses the specified target minus executable entry. The risk estimate includes assumed stop slippage, not arbitrary adverse price gaps. Risk percentage uses the current realised balance. These values are estimates, not fill guarantees.
- Stops/targets are tested against the executable bid candle for buys and the ask candle for sells. A stop gap at the candle open fills at that worse opening quote plus the **instrument-specific adverse slippage**. Otherwise, stop fills use the stop plus the same adverse slippage. A target receives its requested price; favourable gap improvement is not credited.
- Known opening triggers are processed first. If neither triggers at the open and both stop and target are touched within the candle, **the stop is processed first**. Candle data alone cannot establish the actual intrabar execution order. The same engine processes observed quote segments during continuous practice.
- An order does not retroactively process the candle on which it was entered. New revealed candles / newly observed live quote segments process existing positions once.
- No commission, swap, interest, latency, variable intrabar spread, exchange fees, liquidity/depth model, leverage, margin calls or real trading venue are implemented.

## Trading interactions

Opening another buy creates another independently tracked buy position. It does not replace a previous position or clear a session. **Sell to close** closes the selected buy at the current bid; **Buy to close** closes a selected sell at the current ask. These labels refer to exits. The order ticket's **Open buy/Open sell** controls choose the direction of a new position. Closing one position does not close the others. There is no hidden automatic netting.

The chart shows each open entry, stop and target. Horizontal levels, price regions and trend lines are student drawings and do not execute orders. They remain usable during continuous practice. A local practice snapshot preserves the account and drawings across navigation/reload; it resumes paused. Explicit session save pauses and closes all remaining positions at current quotes, then saves an immutable review snapshot (updated if the same session is saved again). Restart creates a new session ID. Changing starting balance begins a new account while preserving chart drawings; changing mode restarts both account and chart. Switching instruments requires all open positions to be closed first. It preserves the balance and closed-trade history, starts a fresh path in the selected instrument, resets the order ticket to that instrument’s defaults and clears old price drawings. Every new trade and saved session stores its instrument. Old EUR/USD snapshots without instrument tags are recovered as EUR/USD without changing their funds or positions. Each price is formatted using that trade’s own instrument when reviewing history.

## Learning definitions and assessment

- Confirmed swing high: its high is strictly above each of two candles on either side. Confirmed swing low: its low is strictly below each of two on either side. The final two revealed bars cannot yet be confirmed swings. Ties are not strict pivots.
- Uptrend/downtrend: compare sequences of confirmed swing highs and lows; a single opposing candle does not define a reversal.
- A closing break in the prevailing direction beyond a confirmed swing is called BOS here. A first opposing structural break is sometimes called CHoCH. Educators may use other definitions; ChartStep explicitly acknowledges the differences.
- Three-candle bullish FVG: `C.low > A.high`, band `[A.high, C.low]`. Bearish: `C.high < A.low`, band `[C.high, A.low]`. The middle candle's body alone does not define the gap. FVGs do not guarantee a fill or reaction.
- Equal highs/lows and sweeps are visible patterns. Explanations about clustered stops are interpretations, not proof of order quantities or institutional intent.
- A correct marking exercise requires both the correct answer and an appropriate drawing within its authored tolerance. Regions must span the centre of the permitted band and have a meaningful height. Only drawings made at the initial replay position are eligible for a scored marking. The numeric-entry controls are equivalent to chart-click coordinates.
- Submitting locks the attempt's answer and drawings. New candles are revealed before specific outcome feedback. Wrong decisions receive explanation and a retry; no money or points are awarded.
- Revealing bars before answering, rewinding, restarting after revealing, or returning to a completed lesson marks the run as exploration. It still receives teaching feedback, but does not create a new assessed completion. Rewind clears orders, trade history, annotations and the submitted answer to prevent an inconsistent past ledger.
- Progress is deduplicated by scenario ID. There are no fake pre-completed lessons, streaks or fabricated analytics.

## Instrument conventions

See [INSTRUMENTS.md](INSTRUMENTS.md) for the complete fictional contract table, assumptions and source for precious-metal quoting units. Prices, spread amounts, seed anchors and volatility settings are exercise design choices, not current market quotes or representations of a particular broker.

## Attribution

TradingView Lightweight Charts™ is used under Apache 2.0. Its attribution logo is enabled and a visible TradingView link accompanies charts. The shipped third-party licence and NOTICE are available under `/licenses/lightweight-charts/`.
