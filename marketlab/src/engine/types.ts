export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
export type Category =
  | "Candlestick fundamentals"
  | "Market structure"
  | "Support & resistance"
  | "Liquidity concepts"
  | "Fair value gaps"
  | "Trends & ranges"
  | "Risk management"
  | "Trading psychology"
  | "Market conditions";
export type Annotation = {
  id: string;
  kind: "level" | "zone" | "trend";
  price: number;
  endPrice?: number;
  time?: number;
  endTime?: number;
  createdAt: number;
};
export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: "Beginner" | "Intermediate";
  duration: number;
  instrument: "EUR/USD";
  timeframe: "15m";
  type: "Guided lesson" | "Decision challenge" | "Chart exercise";
  objective: string;
  learn: string;
  challenge: string;
  options: string[];
  correctOption: number;
  feedback: string;
  retry: string;
  outcome: string;
  annotation?: {
    kind: "level" | "zone";
    low: number;
    high: number;
    instruction: string;
  };
  candles: Candle[];
  startIndex: number;
  revealIndex: number;
  spread: number;
}
export interface Attempt {
  scenarioId: string;
  correct: boolean;
  at: string;
  exploration: boolean;
  answer: string;
}
export interface JournalEntry {
  id: string;
  scenarioId: string;
  at: string;
  analysis: string;
  hypothesis: string;
  risk: string;
  happened: string;
  learned: string;
}
export type Side = "buy" | "sell";
export type InstrumentId =
  "EUR/USD" | "GBP/USD" | "AUD/USD" | "XAU/USD" | "XAG/USD";
export interface Position {
  id: string;
  side: Side;
  units: number;
  entry: number;
  stop: number;
  target: number;
  openedAt: number;
  notional: number;
  initialRisk: number;
  instrument?: InstrumentId;
}
export interface Trade extends Position {
  exit: number;
  closedAt: number;
  pnl: number;
  reason: "Manual close" | "Stop-loss" | "Take-profit";
}
export interface Account {
  balance: number;
  positions: Position[];
  trades: Trade[];
}
export interface SavedSession {
  id: string;
  scenarioId: string;
  at: string;
  balance: number;
  initialBalance: number;
  mode: "replay" | "live";
  trades: Trade[];
  instrument?: InstrumentId;
}
export interface Progress {
  version: 1;
  completed: string[];
  attempts: Attempt[];
  journal: JournalEntry[];
  sessions: SavedSession[];
  lastScenarioId: string;
  academyTheme: boolean;
  theme: "light" | "dark";
  practiceBalance: number;
}
