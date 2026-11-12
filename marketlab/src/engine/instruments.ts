import type { InstrumentId } from "./types";

export interface Instrument {
  id: InstrumentId;
  name: string;
  group: "Forex" | "Metals";
  symbol: string;
  unit: string;
  quantityLabel: string;
  precision: number;
  priceStep: number;
  quantityStep: number;
  minUnits: number;
  defaultUnits: number;
  referencePrice: number;
  spread: number;
  slippage: number;
  stopDistance: number;
  tickVolatility: number;
}

/** Fictional contracts: USD per base unit, no lot multipliers or FX conversion. */
export const instruments: Instrument[] = [
  {
    id: "EUR/USD",
    name: "Euro / US dollar",
    group: "Forex",
    symbol: "€",
    unit: "EUR",
    quantityLabel: "EUR units",
    precision: 5,
    priceStep: 0.00001,
    quantityStep: 1,
    minUnits: 1,
    defaultUnits: 1000,
    referencePrice: 1.085,
    spread: 0.00012,
    slippage: 0.00002,
    stopDistance: 0.001,
    tickVolatility: 0.00017,
  },
  {
    id: "GBP/USD",
    name: "Pound / US dollar",
    group: "Forex",
    symbol: "£",
    unit: "GBP",
    quantityLabel: "GBP units",
    precision: 5,
    priceStep: 0.00001,
    quantityStep: 1,
    minUnits: 1,
    defaultUnits: 1000,
    referencePrice: 1.27,
    spread: 0.00016,
    slippage: 0.00003,
    stopDistance: 0.0015,
    tickVolatility: 0.00023,
  },
  {
    id: "AUD/USD",
    name: "Australian dollar / US dollar",
    group: "Forex",
    symbol: "A$",
    unit: "AUD",
    quantityLabel: "AUD units",
    precision: 5,
    priceStep: 0.00001,
    quantityStep: 1,
    minUnits: 1,
    defaultUnits: 1000,
    referencePrice: 0.66,
    spread: 0.00014,
    slippage: 0.00002,
    stopDistance: 0.001,
    tickVolatility: 0.00015,
  },
  {
    id: "XAU/USD",
    name: "Gold",
    group: "Metals",
    symbol: "Au",
    unit: "oz",
    quantityLabel: "Troy ounces of gold",
    precision: 2,
    priceStep: 0.01,
    quantityStep: 0.01,
    minUnits: 0.01,
    defaultUnits: 1,
    referencePrice: 2400,
    spread: 0.5,
    slippage: 0.05,
    stopDistance: 12,
    tickVolatility: 1.25,
  },
  {
    id: "XAG/USD",
    name: "Silver",
    group: "Metals",
    symbol: "Ag",
    unit: "oz",
    quantityLabel: "Troy ounces of silver",
    precision: 3,
    priceStep: 0.001,
    quantityStep: 0.1,
    minUnits: 0.1,
    defaultUnits: 10,
    referencePrice: 28,
    spread: 0.03,
    slippage: 0.005,
    stopDistance: 0.25,
    tickVolatility: 0.025,
  },
];
export const isInstrumentId = (value: unknown): value is InstrumentId =>
  instruments.some((i) => i.id === value);
export const getInstrument = (id: InstrumentId = "EUR/USD") =>
  instruments.find((i) => i.id === id) ?? instruments[0];
export const formatPrice = (price: number, id: InstrumentId = "EUR/USD") =>
  price.toFixed(getInstrument(id).precision);
export const spreadDescription = (
  id: InstrumentId,
  spread = getInstrument(id).spread,
) =>
  getInstrument(id).group === "Forex"
    ? `${(spread / 0.0001).toFixed(1)} pip spread`
    : `$${spread.toFixed(getInstrument(id).precision)} / oz spread`;
export const slippageDescription = (id: InstrumentId) =>
  getInstrument(id).group === "Forex"
    ? `${(getInstrument(id).slippage / 0.0001).toFixed(1)} pip`
    : `$${getInstrument(id).slippage.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} / oz`;
export const validUnits = (units: number, instrument: Instrument) =>
  Number.isFinite(units) &&
  units >= instrument.minUnits &&
  units <= 1000000 &&
  Math.abs(
    units / instrument.quantityStep -
      Math.round(units / instrument.quantityStep),
  ) < 1e-6;
