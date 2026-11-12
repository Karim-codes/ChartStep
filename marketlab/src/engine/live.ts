import type { Candle, InstrumentId } from "./types";
import { getInstrument } from "./instruments";

export interface LiveMarket {
  sessionSeed: number;
  instrument: InstrumentId;
  candles: Candle[];
  tick: number;
  clock: number;
  seed: number;
}
export const newMarketSeed = () =>
  globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
export const advanceSeed = (seed: number) =>
  (Math.imul(seed, 1664525) + 1013904223) >>> 0;

/** Initial history is generated from its own seed, independently of textbook lesson paths. */
export function createLiveMarket(
  instrument: InstrumentId,
  seed: number,
): LiveMarket {
  const spec = getInstrument(instrument),
    time = 1736150400;
  let market: LiveMarket = {
    sessionSeed: seed >>> 0,
    instrument,
    candles: [
      {
        time,
        open: spec.referencePrice,
        high: spec.referencePrice,
        low: spec.referencePrice,
        close: spec.referencePrice,
      },
    ],
    tick: 0,
    clock: time,
    seed: seed >>> 0,
  };
  for (let i = 0; i < 399; i++) market = tickMarket(market).market;
  return market;
}

/** Generate only the next tick. Production UI supplies fresh browser randomness for new sessions; injectable seeds make execution testable. */
export function tickMarket(market: LiveMarket): {
  market: LiveMarket;
  movement: Candle;
} {
  const spec = getInstrument(market.instrument);
  const seed = advanceSeed(market.seed),
    nextSeed = advanceSeed(seed);
  const last = market.candles.at(-1)!,
    previous = last.close,
    tick = market.tick + 1,
    clock = market.clock + 90;
  const regime =
    Math.sin(tick / 37 + (nextSeed / 4294967296) * 0.18) *
    spec.tickVolatility *
    0.14;
  const noise = (seed / 4294967296 - 0.5) * spec.tickVolatility;
  const reversion = (spec.referencePrice - previous) * 0.001;
  const close = Number(
    Math.max(
      spec.referencePrice * 0.25,
      Math.min(spec.referencePrice * 4, previous + noise + regime + reversion),
    ).toFixed(spec.precision),
  );
  const candles = [...market.candles];
  if (clock >= last.time + 900)
    candles.push({
      time: last.time + 900,
      open: previous,
      high: Math.max(previous, close),
      low: Math.min(previous, close),
      close,
    });
  else
    candles[candles.length - 1] = {
      ...last,
      high: Math.max(last.high, close),
      low: Math.min(last.low, close),
      close,
    };
  if (candles.length > 600) candles.shift();
  return {
    market: {
      instrument: spec.id,
      candles,
      tick,
      clock,
      seed: nextSeed,
      sessionSeed: market.sessionSeed,
    },
    movement: {
      time: clock,
      open: previous,
      high: Math.max(previous, close),
      low: Math.min(previous, close),
      close,
    },
  };
}
