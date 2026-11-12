import type {
  Account,
  Candle,
  Position,
  Side,
  Trade,
  InstrumentId,
} from "./types";
import { getInstrument, validUnits } from "./instruments";

export const PRACTICE_BALANCES = [10000, 50000, 100000] as const;
export const initialAccount = (balance = 10000): Account => ({
  balance: PRACTICE_BALANCES.some((v) => v === balance) ? balance : 10000,
  positions: [],
  trades: [],
});
export const DEFAULT_SPREAD = 0.00012;
export const SLIPPAGE = 0.00002;
export const money = (n: number) => Number(n.toFixed(6));
export const quote = (mid: number, spread = DEFAULT_SPREAD) => ({
  bid: mid - spread / 2,
  ask: mid + spread / 2,
});
export const entryPrice = (side: Side, mid: number, spread: number) =>
  side === "buy" ? quote(mid, spread).ask : quote(mid, spread).bid;
export const exitPrice = (side: Side, mid: number, spread: number) =>
  side === "buy" ? quote(mid, spread).bid : quote(mid, spread).ask;
export const profit = (
  p: Pick<Position, "entry" | "units" | "side">,
  exit: number,
) => money((exit - p.entry) * p.units * (p.side === "buy" ? 1 : -1));
export const unrealised = (
  a: Account,
  mid: number,
  spread: number,
  instrument: InstrumentId = "EUR/USD",
) =>
  money(
    a.positions
      .filter((p) => (p.instrument ?? "EUR/USD") === instrument)
      .reduce((n, p) => n + profit(p, exitPrice(p.side, mid, spread)), 0),
  );
export const reserved = (a: Account) =>
  money(a.positions.reduce((n, p) => n + p.notional, 0));
export const availableFunds = (
  a: Account,
  mid: number,
  spread: number,
  instrument: InstrumentId = "EUR/USD",
) =>
  Math.max(
    0,
    a.balance +
      Math.min(0, unrealised(a, mid, spread, instrument)) -
      reserved(a),
  );

export interface OrderInput {
  side: Side;
  units: number;
  stop: number;
  target: number;
}
export function validateOrder(
  a: Account,
  order: OrderInput,
  mid: number,
  spread: number,
  instrument: InstrumentId = "EUR/USD",
): string | null {
  const spec = getInstrument(instrument);
  if (
    ![order.units, order.stop, order.target, mid, spread].every(Number.isFinite)
  )
    return "Enter valid numbers for units, stop-loss and take-profit.";
  if (!validUnits(order.units, spec))
    return `Choose ${spec.quantityLabel} in steps of ${spec.quantityStep}, from ${spec.minUnits} to 1,000,000.`;
  if (a.positions.some((p) => (p.instrument ?? "EUR/USD") !== instrument))
    return "Close your open positions before switching instruments.";
  if (order.stop <= 0 || order.target <= 0 || mid <= 0 || spread < 0)
    return "All prices must be greater than zero.";
  const entry = entryPrice(order.side, mid, spread);
  const currentExit = exitPrice(order.side, mid, spread);
  if (
    order.side === "buy" &&
    (order.stop >= currentExit || order.target <= entry)
  )
    return "For a buy, put the stop below the current sell quote and the target above the buy entry.";
  if (
    order.side === "sell" &&
    (order.stop <= currentExit || order.target >= entry)
  )
    return "For a sell, put the stop above the current buy quote and the target below the sell entry.";
  const notional = order.units * entry;
  if (notional > availableFunds(a, mid, spread, instrument))
    return `This size reserves $${notional.toFixed(2)}. You have $${availableFunds(a, mid, spread, instrument).toFixed(2)} available. Choose fewer units; this demo uses no leverage.`;
  if (a.positions.length >= 5)
    return "Review or close one of your five open positions before opening another.";
  return null;
}
export function openPosition(
  a: Account,
  order: OrderInput,
  candle: Candle,
  spread: number,
  instrument: InstrumentId = "EUR/USD",
): Account {
  const error = validateOrder(a, order, candle.close, spread, instrument);
  if (error) throw new Error(error);
  const entry = entryPrice(order.side, candle.close, spread);
  const p: Position = {
    ...order,
    instrument,
    entry,
    id: `${candle.time}-${a.trades.length}-${a.positions.length}`,
    openedAt: candle.time,
    notional: money(entry * order.units),
    initialRisk: money(
      Math.abs(entry - order.stop) * order.units +
        getInstrument(instrument).slippage * order.units,
    ),
  };
  return { ...a, positions: [...a.positions, p] };
}
function fill(
  a: Account,
  p: Position,
  exit: number,
  time: number,
  reason: Trade["reason"],
): Account {
  const pnl = profit(p, exit);
  const trade: Trade = { ...p, exit, closedAt: time, pnl, reason };
  return {
    ...a,
    balance: money(a.balance + pnl),
    positions: a.positions.filter((x) => x.id !== p.id),
    trades: [...a.trades, trade],
  };
}
export function closePosition(
  a: Account,
  id: string,
  candle: Candle,
  spread: number,
  instrument: InstrumentId = "EUR/USD",
): Account {
  const p = a.positions.find((p) => p.id === id);
  return p && (p.instrument ?? "EUR/USD") === instrument
    ? fill(
        a,
        p,
        exitPrice(p.side, candle.close, spread),
        candle.time,
        "Manual close",
      )
    : a;
}
/** OHLC values are mid-prices. Trigger and gap tests use the executable bid or ask. */
export function processCandle(
  account: Account,
  c: Candle,
  spread: number,
  instrument: InstrumentId = "EUR/USD",
): Account {
  let a = account;
  for (const p of account.positions) {
    if (c.time <= p.openedAt || (p.instrument ?? "EUR/USD") !== instrument)
      continue;
    const offset = ((p.side === "buy" ? -1 : 1) * spread) / 2;
    const o = c.open + offset,
      h = c.high + offset,
      l = c.low + offset;
    const slippage = getInstrument(instrument).slippage;
    const adverse = p.side === "buy" ? -slippage : slippage;
    const stoppedAtOpen = p.side === "buy" ? o <= p.stop : o >= p.stop;
    const targetedAtOpen = p.side === "buy" ? o >= p.target : o <= p.target;
    const stopped = p.side === "buy" ? l <= p.stop : h >= p.stop;
    const targeted = p.side === "buy" ? h >= p.target : l <= p.target;
    if (stoppedAtOpen)
      a = fill(a, p, Math.max(0.00001, o + adverse), c.time, "Stop-loss");
    else if (targetedAtOpen) a = fill(a, p, p.target, c.time, "Take-profit");
    else if (stopped)
      a = fill(a, p, Math.max(0.00001, p.stop + adverse), c.time, "Stop-loss");
    else if (targeted) a = fill(a, p, p.target, c.time, "Take-profit");
  }
  return a;
}
