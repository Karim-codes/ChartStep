export const brand = {
  name: "ChartStep",
  tagline: "Learn by doing.",
  owner: "CodeRaxa",
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || "hello@coderaxa.com",
  academy: { name: "Example Academy", subtitle: "Partner workspace preview" },
};
export const pricing = [
  {
    name: "Free demo",
    price: "£0",
    period: "always free to explore",
    label: "Available now",
    description: "A little curiosity is all you need.",
    features: [
      "Interactive beginner lessons",
      "Selected scenario practice",
      "Guided market replay",
    ],
    action: "Explore the demo",
    planned: false,
  },
  {
    name: "Student Pro",
    price: "£9.99",
    period: "/ month · provisional",
    label: "Planned",
    description: "More room to practise and grow.",
    features: [
      "Full scenario library",
      "Unlimited replay & virtual trading",
      "Journal and learning progress",
      "Advanced learning challenges",
    ],
    action: "Enquire about Student Pro",
    planned: true,
  },
  {
    name: "Academy",
    price: "£79",
    period: "/ month · from · provisional",
    label: "Planned",
    description: "Bring hands-on learning to your students.",
    features: [
      "A branded academy workspace",
      "Assignments and student access",
      "Instructor-created scenarios",
      "Mentor feedback & progress review",
    ],
    action: "Discuss your academy",
    planned: true,
  },
];
export const glossary: Record<string, string> = {
  Forex:
    "The exchange of one currency for another. EUR/USD expresses the US dollar price of one euro.",
  Candlestick:
    "The open, high, low and close of a time period. The body connects open and close; wicks extend to the high and low.",
  "Bullish / bearish":
    "Bullish describes upward movement or an upward expectation. Bearish describes downward movement or a downward expectation.",
  Pip: "A standard price increment: 0.0001 for EUR/USD. A move from 1.0830 to 1.0831 is one pip.",
  Spread:
    "The ask (buy price) minus the bid (sell price). This difference creates a trading cost even if the mid-price stays still.",
  "Units & notional":
    "Forex quantities count euros, pounds or Australian dollars in the selected pair. Gold and silver quantities are troy ounces. Quantity × entry price is the USD notional. This demo reserves that full amount, without leverage or an implicit lot multiplier.",
  "Gold & silver quantities":
    "Gold (XAU/USD) and silver (XAG/USD) are quoted in USD per troy ounce here. One unit means one troy ounce. Gold can be sized in 0.01 oz steps and silver in 0.1 oz steps. Broker lots and exchange futures can use different contract multipliers; this simulation uses base ounces only.",
  "Stop-loss":
    "A planned adverse exit. A gap or slippage can produce a worse fill than the specified stop price.",
  "Take-profit":
    "A planned favourable exit. It does not guarantee that price will reach the target.",
  "Reward-to-risk":
    "Potential gain at the target divided by planned loss at the stop. It measures a plan, not the likelihood of success.",
  Slippage:
    "The difference between a requested price and the actual execution price. Stop exits use an assumed adverse amount for each instrument: 0.2 pips on EUR/USD and AUD/USD, 0.3 pips on GBP/USD, $0.05 per gold ounce or $0.005 per silver ounce. Gaps can increase the loss further.",
  "Leverage & margin":
    "Leverage creates exposure larger than the funds committed. Margin is the funds required to support it. This demo has no leverage: full notional is reserved for every position.",
  Liquidity:
    "How readily an asset can be bought or sold. A candle chart cannot prove where pending orders are or why participants trade.",
  "Swing & structure":
    "A swing is a local turning point. Here two candles on each side must have lower highs for a swing high, or higher lows for a swing low. Confirmation uses revealed candles only.",
  "BOS & CHoCH":
    "Here a break of structure requires a close beyond a confirmed swing in the prevailing direction. A first opposite break is sometimes called change of character. Methods and definitions differ.",
  "Fair value gap":
    "A three-candle non-overlap. Bullish: C low > A high. Bearish: C high < A low. It is a chart convention with no guaranteed future reaction.",
  "Synthetic data":
    "Fictional prices generated for learning. Guided lessons use repeatable authored data. Each fresh continuous-market session uses a new random seed for its history and future movement. These are not live quotes or actual historical events.",
};
