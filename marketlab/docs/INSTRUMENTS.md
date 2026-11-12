# Fictional practice instruments

All prices are synthetic. The engine uses USD per **base unit**, so USD P&L is `(exit − entry) × quantity` for buys, with the sign reversed for sells. Full entry notional is reserved, without leverage. These are simplified directional exercises, not broker lot definitions, leveraged CFDs or futures contracts.

| Instrument | Base quantity | Minimum / increment | Price decimals | Fixed spread | Adverse stop slippage | Default quantity |
| --- | --- | --- | --- | --- | --- | --- |
| EUR/USD | Euros | 1 / 1 EUR | 5 | 0.00012 (1.2 pips) | 0.00002 (0.2 pips) | 1,000 EUR |
| GBP/USD | Pounds | 1 / 1 GBP | 5 | 0.00016 (1.6 pips) | 0.00003 (0.3 pips) | 1,000 GBP |
| AUD/USD | Australian dollars | 1 / 1 AUD | 5 | 0.00014 (1.4 pips) | 0.00002 (0.2 pips) | 1,000 AUD |
| Gold, XAU/USD | Troy ounces | 0.01 / 0.01 oz | 2 | $0.50 / oz | $0.05 / oz | 1 oz |
| Silver, XAG/USD | Troy ounces | 0.1 / 0.1 oz | 3 | $0.030 / oz | $0.005 / oz | 10 oz |

The USD-per-troy-ounce convention for precious metals is documented by the [LBMA Global Precious Metals Code, quoting conventions](https://cdn.lbma.org.uk/downloads/Publications/2022/LBMA-GPMC-Dec-2022.pdf). The spreads, increments, slippage amounts, default quantities and initial reference prices above are **ChartStep exercise assumptions**, not live quotes or a broker specification. Price anchors (such as $2,400 for gold) exist only to generate synthetic data; they do not claim to be today's prices.

Examples:

- Buy 1 oz of gold at ask $2,400.25. With an unchanged $2,400.00 mid and $0.50 spread, an immediate close fills at bid $2,399.75: **−$0.50**. A $10 rise in the mid-price produces **+$9.50** before any other modelled exit assumption.
- Sell 0.1 oz of gold at bid $2,399.75 and buy to close at ask $2,390.25: `(2399.75 − 2390.25) × 0.1 = +$0.95`.
- A 10 oz silver position has an immediate spread cost of `10 × $0.03 = $0.30`.

Switching markets preserves the realised account balance and closed history. Open positions must be closed first; the selector explains this requirement and is disabled while positions remain. Existing drawings reset because a EUR/USD price level has no sensible meaning on a gold chart. Closed history retains the original instrument and its own price precision. The demo does not model simultaneous positions across different instruments or currency conversion.

Fresh market uses a new browser-generated random seed for both the initial 40 candles and ongoing ticks. It resets the selected fictional starting account and clears session drawings and orders. The same session continues indefinitely while playing, with a rolling 600-bar display window. Saved practice restores the existing path and account paused; it does not reroll open trades or apply unseen movement.
