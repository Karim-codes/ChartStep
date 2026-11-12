import type { Candle } from "./types";

export const BASE_PRICE = 1.0832;
export const price = (pips: number) =>
  Number((BASE_PRICE + pips * 0.0001).toFixed(5));
const round = (n: number) => Number(n.toFixed(5));
export type Shape =
  | "up"
  | "down"
  | "range"
  | "support"
  | "breakout"
  | "falsebreak"
  | "sweepHigh"
  | "sweepLow"
  | "fvg"
  | "fvgFail"
  | "bearFvg"
  | "volatility"
  | "gap"
  | "news";
const anchors: Record<Shape, number[]> = {
  up: [0, 6, 2, 13, 8, 22, 15, 29, 23, 36, 29, 40],
  down: [32, 23, 28, 16, 21, 10, 15, 3, 8, -4, 1, -10],
  range: [0, 8, -1, 8, 0, 8, 1, 7, 0, 8, 0, 5],
  support: [19, 7, 1, 12, 5, 1, 8, 17, 13, 22, 18, 26],
  breakout: [0, 8, 1, 8, 2, 7, 15, 9, 18, 24, 20, 28],
  falsebreak: [0, 8, 1, 8, 2, 7, 12, 5, 0, -6, -2, -9],
  sweepHigh: [0, 8, 0, 8, 1, 8, 6, -2, -7, -3, -12, -8],
  sweepLow: [8, 0, 8, 0, 7, 0, 3, 12, 18, 13, 23, 18],
  fvg: [0, 4, 1, 6, 3, 7, 24, 20, 17, 25, 30, 27],
  fvgFail: [0, 4, 1, 6, 3, 7, 24, 18, 10, 2, -5, -9],
  bearFvg: [28, 24, 27, 22, 25, 21, 4, 8, 10, 1, -5, -2],
  volatility: [0, 2, 0, 2, 0, 2, 8, -5, 23, -9, 30, 13],
  gap: [0, 5, 2, 8, 4, 10, 13, -15, -10, -21, -16, -24],
  news: [0, 3, 0, 3, 0, 3, 6, 31, -12, 17, -8, 9],
};

/** Fixed integer PRNG. Data is deliberately authored, synthetic and repeatable. */
export function makeCandles(shape: Shape, seed = 1): Candle[] {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const points = anchors[shape];
  const candles: Candle[] = [];
  for (let i = 0; i < 66; i++) {
    const segment = Math.min(10, Math.floor(i / 6));
    const fraction = (i % 6) / 6;
    const delta =
      points[segment] + (points[segment + 1] - points[segment]) * fraction;
    const close = price(delta + (random() - 0.5) * 1.2);
    const prior = candles.at(-1)?.close ?? price(points[0] - 1);
    const open = shape === "gap" && i === 39 ? price(-14) : prior;
    const wick = (shape === "news" && i > 38 ? 4 : 0.6) + random() * 1.2;
    candles.push({
      time: 1736150400 + i * 900,
      open,
      close,
      high: round(Math.max(open, close) + wick * 0.0001),
      low: round(Math.min(open, close) - wick * 0.0001),
    });
  }
  if (shape === "fvg" || shape === "fvgFail" || shape === "bearFvg") {
    const invert = shape === "bearFvg";
    const values = invert
      ? [
          [21, 23, 19, 20],
          [20, 21, 8, 9],
          [9, 12, 6, 8],
        ]
      : [
          [7, 9, 5, 8],
          [8, 21, 7, 20],
          [20, 24, 17, 22],
        ];
    values.forEach(([o, h, l, c], k) => {
      candles[32 + k] = {
        ...candles[32 + k],
        open: price(o),
        high: price(h),
        low: price(l),
        close: price(c),
      };
    });
    candles[35].open = candles[34].close;
    candles[35].high = Math.max(candles[35].open, candles[35].high);
    candles[35].low = Math.min(candles[35].open, candles[35].low);
  }
  if (shape === "sweepHigh")
    candles[36] = {
      ...candles[36],
      open: price(7),
      high: price(14),
      low: price(4),
      close: price(6),
    };
  if (shape === "sweepLow")
    candles[36] = {
      ...candles[36],
      open: price(1),
      high: price(5),
      low: price(-6),
      close: price(3),
    };
  return candles;
}

export function validCandle(c: Candle) {
  return (
    [c.time, c.open, c.high, c.low, c.close].every(Number.isFinite) &&
    c.low > 0 &&
    c.low <= Math.min(c.open, c.close) &&
    c.high >= Math.max(c.open, c.close)
  );
}

export function confirmedSwings(candles: Candle[], radius = 2) {
  const points: { index: number; price: number; kind: "high" | "low" }[] = [];
  for (let i = radius; i < candles.length - radius; i++) {
    const window = candles.slice(i - radius, i + radius + 1);
    if (window.every((c, j) => j === radius || c.high < candles[i].high))
      points.push({ index: i, price: candles[i].high, kind: "high" });
    if (window.every((c, j) => j === radius || c.low > candles[i].low))
      points.push({ index: i, price: candles[i].low, kind: "low" });
  }
  return points;
}
