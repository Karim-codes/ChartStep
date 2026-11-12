import { makeCandles, price, type Shape } from "../engine/data";
import type { Category, Scenario } from "../engine/types";

type Definition = Omit<
  Scenario,
  | "candles"
  | "instrument"
  | "timeframe"
  | "startIndex"
  | "revealIndex"
  | "spread"
> & { shape: Shape; spread?: number };
const definitions: Definition[] = [
  {
    id: "candle-body",
    category: "Candlestick fundamentals",
    title: "Read your first candlestick",
    description: "Four prices. One clear story.",
    difficulty: "Beginner",
    duration: 5,
    type: "Guided lesson",
    shape: "up",
    objective: "Read a candle",
    learn:
      "A candle summarises one time period. The body joins the opening and closing prices; thin lines (wicks) reach the highest and lowest prices. A green candle closed above its opening price. One candle cannot predict the next.",
    challenge: "Look at the green candles. What does a green body tell you?",
    options: [
      "The closing price was above the opening price",
      "The next candle will rise",
      "There were no sellers",
    ],
    correctOption: 0,
    feedback:
      "Green describes a completed period: close above open. Both buyers and sellers still participated. The next candle can move either way.",
    retry:
      "Compare the top and bottom of a green body. Colour describes open versus close, not the next move.",
    outcome:
      "The next few candles contain both advances and pullbacks. Candle colour describes what happened, not what must happen next.",
  },
  {
    id: "lower-wick",
    category: "Candlestick fundamentals",
    title: "The story behind a wick",
    description: "See the move that the candle body leaves out.",
    difficulty: "Beginner",
    duration: 6,
    type: "Guided lesson",
    shape: "sweepLow",
    objective: "Interpret a wick",
    learn:
      "A lower wick shows that price traded below the body during the period, then closed higher than that low. Traders sometimes call this rejection. It is an observation, not a promise of a reversal.",
    challenge:
      "Candle 37 has a long lower wick. Which statement is supported by the candle?",
    options: [
      "A rise is guaranteed",
      "Price traded lower, then recovered before the close",
      "Only buyers traded",
    ],
    correctOption: 1,
    feedback:
      "The low records the downward move; the close records the recovery. The wick alone cannot tell us the order of every trade or what comes next.",
    retry: "Separate the lowest price reached from the final closing price.",
    outcome:
      "This example subsequently recovers. Other long lower wicks can be followed by further falls; context and risk still matter.",
  },
  {
    id: "engulfing",
    category: "Candlestick fundamentals",
    title: "Two candles, more context",
    description: "Recognise a bullish engulfing body without overclaiming.",
    difficulty: "Beginner",
    duration: 6,
    type: "Decision challenge",
    shape: "support",
    objective: "Compare candle bodies",
    learn:
      "A bullish engulfing body opens at or below the previous bearish close and closes at or above the previous open. This is a body comparison; the wicks need not be engulfed. It is more useful alongside context than as a standalone signal.",
    challenge:
      "A green body fully covers the previous red body. What can you reasonably conclude?",
    options: [
      "Future price must rise",
      "Buying pressure increased during those periods, but the outcome is uncertain",
      "All trading risk disappeared",
    ],
    correctOption: 1,
    feedback:
      "The body comparison describes a change in the observed candles. It does not establish a guaranteed future direction.",
    retry: "A pattern summarises price action; it cannot remove uncertainty.",
    outcome:
      "Price rises in this authored example, with interruptions. That single outcome does not validate a prediction rule.",
  },
  {
    id: "higher-highs",
    category: "Market structure",
    title: "Spot the uptrend",
    description: "Learn to see higher highs and higher lows.",
    difficulty: "Beginner",
    duration: 8,
    type: "Chart exercise",
    shape: "up",
    objective: "Identify market structure",
    learn:
      "An uptrend is a sequence of swing highs and swing lows that move higher. A swing is a local turning point. In ChartStep it is confirmed only after two candles on each side have lower highs (or higher lows). Different teaching methods use different swing rules.",
    challenge:
      "Mark the most recent confirmed swing low with a horizontal level, then describe the visible structure.",
    options: [
      "Higher highs and higher lows",
      "Lower highs and lower lows",
      "No direction can be observed",
    ],
    correctOption: 0,
    annotation: {
      kind: "level",
      low: price(12),
      high: price(16),
      instruction:
        "Choose Horizontal level, then tap the low near candle 37 (around 1.0846).",
    },
    feedback:
      "The last confirmed low sits above the previous low, while the confirmed highs also rise. Together, these support an uptrend description. The latest unconfirmed turning point is not yet a swing.",
    retry:
      "Compare the trough near candle 37 with the earlier trough near candle 25. Mark the wick low, not the green candle top.",
    outcome:
      "Price continues upward after another pullback. Structure gives context; it does not guarantee continuation.",
  },
  {
    id: "lower-lows",
    category: "Market structure",
    title: "Follow a downtrend",
    description: "The same structure, in the other direction.",
    difficulty: "Beginner",
    duration: 7,
    type: "Guided lesson",
    shape: "down",
    objective: "Identify market structure",
    learn:
      "In a downtrend, confirmed swing highs and lows tend to move lower. A brief upward bounce can occur within that downtrend. We use two candles on either side to confirm a local swing.",
    challenge: "What best describes the visible series of turning points?",
    options: [
      "A stable range",
      "Lower highs and lower lows",
      "A guaranteed upward reversal",
    ],
    correctOption: 1,
    feedback:
      "The bounces fail to reach earlier highs and the troughs make lower lows. An upward candle within this sequence does not by itself reverse the structure.",
    retry:
      "Compare the highs of whole bounces, rather than the colour of the last candle.",
    outcome:
      "Several bounces occur while the broader sequence moves lower. Distinguish a local bounce from a confirmed structure change.",
  },
  {
    id: "structure-break",
    category: "Market structure",
    title: "When structure changes",
    description: "Separate a wick beyond a level from a closing break.",
    difficulty: "Intermediate",
    duration: 8,
    type: "Chart exercise",
    shape: "breakout",
    objective: "Assess a structural break",
    learn:
      "Here a break of structure means a candle close beyond a previously confirmed swing in the existing direction. A wick alone is not a closing break. A first break against the prevailing structure is sometimes called a change of character; interpretations vary.",
    challenge:
      "Draw a level through the repeated highs around 1.0840. Price has closed above them. What is established?",
    options: [
      "The level can never be revisited",
      "A closing break above the visible highs",
      "Proof of institutional buying",
    ],
    correctOption: 1,
    annotation: {
      kind: "level",
      low: price(7),
      high: price(10),
      instruction:
        "Draw a horizontal level through the prior highs, around 1.0840.",
    },
    feedback:
      "The candle body closes above the prior high area. This meets our closing-break rule, while leaving the future retest uncertain.",
    retry:
      "Find the repeated highs before the latest move and compare the close with those prices.",
    outcome:
      "This example retests the former high area before advancing. A retest is possible, not required.",
  },
  {
    id: "support",
    category: "Support & resistance",
    title: "Find a floor, not a promise",
    description: "Mark the area where price has reacted before.",
    difficulty: "Beginner",
    duration: 7,
    type: "Chart exercise",
    shape: "support",
    objective: "Mark a price area",
    learn:
      "Support is an area where earlier downward moves paused or reversed. It is usually an area, not an exact price. Repeated reactions help identify it, but future price can break through.",
    challenge:
      "Highlight the support band around 1.0832–1.0835. What does this area represent?",
    options: [
      "A price that cannot be crossed",
      "An area of earlier reactions worth observing",
      "A guaranteed buy entry",
    ],
    correctOption: 1,
    annotation: {
      kind: "zone",
      low: price(-2),
      high: price(4),
      instruction:
        "Choose Price region. Tap the top and bottom of the earlier low area, around 1.0832–1.0835.",
    },
    feedback:
      "The band groups earlier lows and reactions. Marking an area acknowledges that trading does not repeatedly turn at one perfect price.",
    retry:
      "Look for the earlier troughs. Use two taps to highlight the small price band they occupy.",
    outcome:
      "Price moves away from support in this scenario. A different scenario may break the same kind of area.",
  },
  {
    id: "retest",
    category: "Support & resistance",
    title: "A breakout returns",
    description: "Watch former resistance become a possible support area.",
    difficulty: "Intermediate",
    duration: 8,
    type: "Guided lesson",
    shape: "breakout",
    objective: "Assess a retest",
    learn:
      "Resistance is an area where prior advances stalled. After a closing breakout, price sometimes returns to that area. A reaction there is called a retest. It may hold or fail.",
    challenge:
      "Price has just broken above the earlier highs. What is a disciplined way to study a potential retest?",
    options: [
      "Assume every breakout works",
      "Observe a return to the old area and how price responds",
      "Enter the largest possible position",
    ],
    correctOption: 1,
    feedback:
      "A retest is evidence to observe. The earlier high area provides context, while a predefined risk plan addresses failure.",
    retry:
      "Focus on a process you can repeat even when the trade outcome is uncertain.",
    outcome:
      "The return pauses near former resistance, then continues upward. This is one designed example, not a success rate.",
  },
  {
    id: "failed-breakout",
    category: "Support & resistance",
    title: "Not every breakout holds",
    description: "Learn what invalidation looks like.",
    difficulty: "Intermediate",
    duration: 7,
    type: "Decision challenge",
    shape: "falsebreak",
    objective: "Assess a failed breakout",
    learn:
      "A failed breakout moves outside an established area and then returns inside it. Whether a trade is invalid depends on the plan defined before entry, not the hope that the market will recover.",
    challenge:
      "Price is above the range. If it closes back inside, how should you respond to a plan that required the breakout to hold?",
    options: [
      "Increase the position to recover faster",
      "Review the invalidation rule and accept the planned exit",
      "Move the stop farther away automatically",
    ],
    correctOption: 1,
    feedback:
      "A plan needs a condition that proves its original idea wrong. Respecting that condition matters more than defending the initial opinion.",
    retry:
      "Ask what evidence would invalidate the idea before taking the risk.",
    outcome:
      "Future candles fall back into the prior range and lower. The breakout did not hold in this example.",
  },
  {
    id: "equal-highs",
    category: "Liquidity concepts",
    title: "Why repeated highs matter",
    description: "Observe a common reference area without inventing intent.",
    difficulty: "Beginner",
    duration: 7,
    type: "Chart exercise",
    shape: "range",
    objective: "Mark a price area",
    learn:
      "Equal highs are swing highs near the same price. Some traders interpret this area as a place where stop orders may cluster. A chart cannot prove the location of orders or the intentions of market participants.",
    challenge:
      "Mark the repeated high area around 1.0840. What can we observe directly?",
    options: [
      "The exact number of stop orders",
      "Several prior highs near the same price",
      "An institution’s hidden plan",
    ],
    correctOption: 1,
    annotation: {
      kind: "level",
      low: price(7),
      high: price(11),
      instruction: "Mark the shared high area near 1.0840.",
    },
    feedback:
      "Repeated highs are visible evidence. Calling them a liquidity area is an interpretation; order quantities and intent are not visible in these candles.",
    retry:
      "Separate a visible price pattern from an explanation about other people’s orders.",
    outcome:
      "Price continues rotating around the area. Equal highs alone do not determine the direction of a later move.",
  },
  {
    id: "high-sweep",
    category: "Liquidity concepts",
    title: "Beyond the highs, then back",
    description: "Read a sweep as price behaviour, not a secret signal.",
    difficulty: "Intermediate",
    duration: 8,
    type: "Guided lesson",
    shape: "sweepHigh",
    objective: "Interpret a sweep",
    learn:
      "A high-side sweep describes price trading above earlier highs and then closing back below that area. It can be discussed as a liquidity interpretation, but does not prove a deliberate stop hunt or ensure a reversal.",
    challenge:
      "Candle 37 wicks above the prior highs and closes back beneath them. What is the best description?",
    options: [
      "A guaranteed reversal",
      "An observed sweep and return below the highs",
      "Proof that one institution controls the market",
    ],
    correctOption: 1,
    feedback:
      "The wick and close show the excursion and return. Those observations do not establish the identity or intent of traders.",
    retry:
      "Describe only what the candle can show: the high reached and the final close.",
    outcome:
      "The following candles fall in this case. Sweeps can also be followed by continuation, so direction remains uncertain.",
  },
  {
    id: "low-sweep",
    category: "Liquidity concepts",
    title: "A sweep below the lows",
    description: "Compare the wick with the previous low area.",
    difficulty: "Intermediate",
    duration: 8,
    type: "Guided lesson",
    shape: "sweepLow",
    objective: "Interpret a sweep",
    learn:
      "A low-side sweep trades below a prior low area and closes back above it. It can suggest a temporary rejection of lower prices, but is not proof of where orders were placed.",
    challenge:
      "Candle 37 trades below earlier lows and recovers. What additional discipline still matters?",
    options: [
      "A risk plan and evidence beyond one wick",
      "Removing the stop because a sweep is certain",
      "Treating the chart as proof of a stop hunt",
    ],
    correctOption: 0,
    feedback:
      "A sweep is a description of price behaviour. A broader plan is still needed because the pattern can fail.",
    retry: "Even a clearly visible pattern leaves future prices uncertain.",
    outcome:
      "This scenario recovers after the sweep. Do not treat this authored outcome as an expectation for all sweeps.",
  },
  {
    id: "bullish-fvg",
    category: "Fair value gaps",
    title: "Find the space between candles",
    description: "Use a precise three-candle definition.",
    difficulty: "Intermediate",
    duration: 9,
    type: "Chart exercise",
    shape: "fvg",
    objective: "Identify an imbalance",
    learn:
      "For three consecutive candles A, B and C, a bullish fair value gap (FVG) exists when C’s low is above A’s high. The band between those prices is the gap. B often moves strongly upward. The name is a chart convention, not a claim about fair economic value.",
    challenge:
      "Use candles 33–35. Highlight the band from A’s high (1.0841) to C’s low (1.0849). What establishes this FVG?",
    options: [
      "Any large green candle",
      "C’s low is above A’s high",
      "A guarantee that the gap will fill",
    ],
    correctOption: 1,
    annotation: {
      kind: "zone",
      low: price(7),
      high: price(19),
      instruction:
        "Use Price region and tap the two edges around 1.0841 and 1.0849.",
    },
    feedback:
      "Candle 33’s high is below candle 35’s low. The unoverlapped price band meets our three-candle definition. No prediction is required.",
    retry:
      "Compare the first candle’s high with the third candle’s low, not the middle candle’s body.",
    outcome:
      "Price later approaches the band and continues higher. An FVG may fill partly, fully, or not at all.",
  },
  {
    id: "bearish-fvg",
    category: "Fair value gaps",
    title: "An imbalance to the downside",
    description: "Apply the three-candle rule in reverse.",
    difficulty: "Intermediate",
    duration: 8,
    type: "Guided lesson",
    shape: "bearFvg",
    objective: "Identify an imbalance",
    learn:
      "A bearish FVG exists when candle C’s high is below candle A’s low. The band lies between C’s high and A’s low. It is a non-overlap in a three-candle sequence, not a promise of falling prices.",
    challenge:
      "For candles 33–35, candle C’s high is below A’s low. Which label fits?",
    options: ["Bullish FVG", "Bearish FVG", "Guaranteed sell signal"],
    correctOption: 1,
    feedback:
      "The downward displacement leaves C’s high below A’s low. That is the bearish version of the same non-overlap rule.",
    retry:
      "In a bearish gap, compare the third candle’s high with the first candle’s low.",
    outcome:
      "A later bounce revisits part of the region before price falls again. Neither the revisit nor the decline is guaranteed in other cases.",
  },
  {
    id: "fvg-failure",
    category: "Fair value gaps",
    title: "When the gap does not hold",
    description: "Test an interpretation against new evidence.",
    difficulty: "Intermediate",
    duration: 8,
    type: "Decision challenge",
    shape: "fvgFail",
    objective: "Recognise invalidation",
    learn:
      "An FVG is not a protective barrier. A partial retracement enters the band; a full retracement reaches its far edge. Price can continue through the entire band without producing the anticipated reaction.",
    challenge:
      "You expect a bullish FVG to hold. What should happen if price closes below the whole region?",
    options: [
      "Ignore new evidence",
      "Reassess the hypothesis using the prewritten invalidation rule",
      "Assume the data is wrong",
    ],
    correctOption: 1,
    feedback:
      "New evidence can invalidate a chart idea. The useful skill is updating the hypothesis and keeping risk bounded.",
    retry: "A chart label never overrules the prices that appear afterward.",
    outcome:
      "Price retraces through and below the original band. This example demonstrates why an FVG is not a guaranteed turning point.",
  },
  {
    id: "trend-pullback",
    category: "Trends & ranges",
    title: "A pause inside the trend",
    description: "Distinguish a pullback from a reversal.",
    difficulty: "Beginner",
    duration: 6,
    type: "Guided lesson",
    shape: "up",
    objective: "Classify market behaviour",
    learn:
      "A pullback is a temporary move against a broader trend. A reversal changes that broader direction. A single opposing candle does not establish a reversal; compare confirmed swings over time.",
    challenge:
      "Price briefly moves lower while successive confirmed lows remain higher. Which description is best supported?",
    options: [
      "A pullback within an uptrend",
      "A certain long-term reversal",
      "A market with no fluctuations",
    ],
    correctOption: 0,
    feedback:
      "The broader sequence of higher lows remains intact. A temporary decline can occur within an upward trend.",
    retry:
      "Zoom out mentally: compare several turning points instead of the latest candle.",
    outcome:
      "The broader upward movement resumes in this synthetic case. Pullbacks can deepen, so risk still needs a plan.",
  },
  {
    id: "range",
    category: "Trends & ranges",
    title: "Recognise a market going sideways",
    description: "When neither direction makes lasting progress.",
    difficulty: "Beginner",
    duration: 6,
    type: "Guided lesson",
    shape: "range",
    objective: "Classify market behaviour",
    learn:
      "A range repeatedly moves between upper and lower areas without sustained directional progress. Trading near a boundary still involves uncertainty: price may rotate inward or break out.",
    challenge:
      "The highs and lows repeatedly return to similar areas. What is the clearest description?",
    options: [
      "A strong uptrend",
      "A sideways range",
      "A guaranteed breakout tomorrow",
    ],
    correctOption: 1,
    feedback:
      "The repeated boundaries and lack of sustained higher or lower swings describe a range.",
    retry:
      "Look for lasting progress. Here advances and declines repeatedly return to similar prices.",
    outcome:
      "More rotations follow. A range has no guaranteed expiry time or breakout direction.",
  },
  {
    id: "expansion",
    category: "Trends & ranges",
    title: "From quiet to fast",
    description: "Notice changing candle size before changing your risk.",
    difficulty: "Intermediate",
    duration: 7,
    type: "Decision challenge",
    shape: "volatility",
    objective: "Assess volatility",
    learn:
      "Volatility describes the size and variability of price movements. Larger ranges mean a previously sensible stop distance may be crossed more easily. Volatility does not itself identify a direction.",
    challenge:
      "If candle ranges expand sharply, what deserves review before a new trade?",
    options: [
      "Position size and the planned stop distance",
      "Only the potential profit",
      "Whether to double the position immediately",
    ],
    correctOption: 0,
    feedback:
      "Risk depends on size multiplied by distance to the stop. A wider appropriate stop usually requires fewer units to keep dollar risk constant.",
    retry:
      "Think about how a larger price movement affects the same number of units.",
    outcome:
      "Later candles swing much farther in both directions. Larger candles increase uncertainty as well as potential movement.",
  },
  {
    id: "stop-plan",
    category: "Risk management",
    title: "Give your idea a clear boundary",
    description: "Plan the loss before thinking about the profit.",
    difficulty: "Beginner",
    duration: 8,
    type: "Chart exercise",
    shape: "up",
    objective: "Build a risk plan",
    learn:
      "A stop-loss is an instruction to exit when an idea reaches a predefined adverse price. It limits the planned loss but cannot guarantee a fill at that exact price during gaps. For a buy, the stop must be below the entry and the target above it.",
    challenge:
      "Mark below the recent confirmed low around 1.0846. Why plan this boundary before entering?",
    options: [
      "To guarantee a profitable trade",
      "To define where the idea fails and estimate the potential loss",
      "To make the stop impossible to reach",
    ],
    correctOption: 1,
    annotation: {
      kind: "level",
      low: price(9),
      high: price(15),
      instruction:
        "Mark a proposed boundary below the recent low, around 1.0843–1.0847.",
    },
    feedback:
      "A stop belongs with an invalidation idea and a suitable position size. It is a risk tool, not a guarantee against slippage.",
    retry:
      "Choose a level below the recent low, then consider the loss if that level is reached.",
    outcome:
      "Price advances here, but a profitable outcome does not prove that any chosen risk size was appropriate.",
  },
  {
    id: "position-size",
    category: "Risk management",
    title: "Small size, deliberate risk",
    description: "Turn a stop distance into a dollar amount.",
    difficulty: "Beginner",
    duration: 7,
    type: "Guided lesson",
    shape: "down",
    objective: "Calculate risk",
    learn:
      "For EUR/USD measured in euro units, a 0.0010 adverse move equals $0.001 per unit. A 1,000-unit position with that distance risks about $1 before costs. A pip is 0.0001 for this pair. Risk scales with both distance and units.",
    challenge:
      "Ignoring costs, what is the risk on 2,000 units with a stop 0.0020 from entry?",
    options: ["$4", "$40", "$400"],
    correctOption: 0,
    feedback:
      "2,000 × 0.0020 = $4. A wider stop or a larger position increases the dollar loss. Spread, commission and slippage may add costs.",
    retry:
      "Multiply units by the price distance. Keep the decimal places in the price.",
    outcome:
      "The downward move illustrates why the same price path creates different dollar outcomes for different position sizes.",
  },
  {
    id: "spread",
    category: "Risk management",
    title: "The cost between buy and sell",
    description: "Understand why a new position starts slightly behind.",
    difficulty: "Beginner",
    duration: 7,
    type: "Guided lesson",
    shape: "range",
    objective: "Understand trading costs",
    learn:
      "The bid is the price you can sell at; the ask is the price you can buy at. Their difference is the spread. This example uses 1.2 pips (0.00012). Buying at the ask and immediately selling at the bid incurs the spread even if the mid-price does not move.",
    challenge:
      "With a 0.00012 spread, what is the immediate approximate loss on 1,000 units before other costs?",
    options: ["$0.00", "$0.12", "$12.00"],
    correctOption: 1,
    feedback:
      "1,000 × 0.00012 = $0.12. The small initial unrealised loss is the bid/ask difference, not a fabricated penalty.",
    retry:
      "Multiply units by the spread, using 0.00012 as the price difference.",
    outcome:
      "A small price movement may be smaller than trading costs. Costs are part of the plan, especially for frequent trades.",
  },
  {
    id: "fomo",
    category: "Trading psychology",
    title: "You do not have to catch the move",
    description: "Practise a decision without placing an order.",
    difficulty: "Beginner",
    duration: 5,
    type: "Decision challenge",
    shape: "breakout",
    objective: "Practise decision discipline",
    learn:
      "Fear of missing out can make a fast move feel like an obligation to act. A trading plan defines the evidence, invalidation and risk you need. A move that lacks those conditions can be observed without an entry.",
    challenge:
      "Price is moving quickly, but your entry conditions have not occurred. What is the most consistent response?",
    options: [
      "Chase it before it is too late",
      "Wait for your criteria or skip the trade",
      "Increase risk to compensate for a late entry",
    ],
    correctOption: 1,
    feedback:
      "Waiting preserves the process. Missing a move is a valid outcome when the setup did not meet your plan.",
    retry:
      "Ask whether a move happening is the same as your planned setup happening.",
    outcome:
      "The market moves onward. You can make a sound decision to wait even if a move later looks attractive.",
  },
  {
    id: "revenge",
    category: "Trading psychology",
    title: "After a loss, keep the process",
    description: "A losing trade does not create a debt to recover.",
    difficulty: "Beginner",
    duration: 5,
    type: "Decision challenge",
    shape: "falsebreak",
    objective: "Practise decision discipline",
    learn:
      "Revenge trading means changing behaviour to recover a loss quickly, often with impulsive size or weak entries. A planned loss is a possible result of any uncertain trade. A review or a pause can be part of the plan.",
    challenge:
      "A correctly planned trade lost. You feel an urge to double the next position. What is a useful next step?",
    options: [
      "Double the units until the loss is recovered",
      "Pause and review whether the next setup meets the same risk rules",
      "Remove the next stop-loss",
    ],
    correctOption: 1,
    feedback:
      "A previous loss does not improve the odds of the next setup. A pause helps separate the next decision from the urge to recover.",
    retry:
      "Would you take this size and entry if the previous trade had never happened?",
    outcome:
      "The next candles are uncertain too. A process can be evaluated independently of the previous financial result.",
  },
  {
    id: "no-trade",
    category: "Trading psychology",
    title: "A good decision can be no trade",
    description: "Make room for uncertainty in your plan.",
    difficulty: "Beginner",
    duration: 5,
    type: "Decision challenge",
    shape: "range",
    objective: "Practise decision discipline",
    learn:
      "Not trading is an active decision. If the chart is unclear, the costs are unsuitable or the setup does not meet the plan, remaining out can be consistent with good risk management.",
    challenge:
      "The chart is choppy and your plan needs a clear trend. Which action best follows that plan?",
    options: [
      "Enter randomly to gain experience",
      "Stay out and record why the criteria are missing",
      "Trade both directions with twice the size",
    ],
    correctOption: 1,
    feedback:
      "Recording the missing criteria turns a no-trade decision into useful practice. Activity is not the same as learning.",
    retry:
      "A plan can specify conditions for staying out as clearly as conditions for entering.",
    outcome:
      "Price keeps rotating. A no-trade decision can be valid whether the next candle rises or falls.",
  },
  {
    id: "gap",
    category: "Market conditions",
    title: "When price skips your stop",
    description: "Understand the difference between a stop and its fill.",
    difficulty: "Intermediate",
    duration: 8,
    type: "Guided lesson",
    shape: "gap",
    objective: "Understand execution uncertainty",
    learn:
      "A price gap occurs when the next available price is separated from the previous price. If a stop is crossed by the opening price, this simulator fills at that worse opening quote plus configured adverse slippage. A stop price is not a guaranteed execution price.",
    challenge:
      "A buy position has a stop at 1.0830. The next bid opens at 1.0820. Which fill assumption is more conservative?",
    options: [
      "Always fill at 1.0830",
      "Fill near the worse available opening bid, allowing slippage",
      "Cancel the loss because price skipped it",
    ],
    correctOption: 1,
    feedback:
      "A gap can make the first available price worse than the stop. Candle data cannot tell us every available intrabar quote.",
    retry: "Consider what price could actually be available after the gap.",
    outcome:
      "A downward gap appears in this explicitly synthetic sequence. It illustrates why realised loss can exceed the initial risk estimate.",
  },
  {
    id: "wide-spread",
    category: "Market conditions",
    title: "Same chart, wider cost",
    description: "See how a wide spread changes a practice trade.",
    difficulty: "Intermediate",
    duration: 7,
    type: "Guided lesson",
    shape: "range",
    spread: 0.0004,
    objective: "Understand trading costs",
    learn:
      "Spreads can widen in less liquid conditions. This authored scenario uses a fixed 4-pip spread instead of 1.2 pips. The chart displays the mid-price, while buy and sell quotes sit on opposite sides of it.",
    challenge:
      "At a 0.0004 spread, what is the immediate spread cost of buying and closing 1,000 units?",
    options: ["$0.04", "$0.40", "$4.00"],
    correctOption: 1,
    feedback:
      "1,000 × 0.0004 = $0.40. A wider spread increases the move needed to offset costs. This is a scenario assumption, not a live quote.",
    retry: "Use units × spread. A 4-pip spread is 0.0004 for EUR/USD.",
    outcome:
      "Small oscillations continue while the assumed spread stays wide. Waiting can be reasonable when costs are large relative to the planned move.",
  },
  {
    id: "news-volatility",
    category: "Market conditions",
    title: "A sudden change of pace",
    description: "Practise caution during news-like movement.",
    difficulty: "Intermediate",
    duration: 7,
    type: "Decision challenge",
    shape: "news",
    objective: "Assess volatility",
    learn:
      "This is synthetic news-like volatility, not an actual event or historical announcement. Fast movement can increase uncertainty about stops, fills and appropriate size. Candle data cannot reveal a true tick-by-tick sequence.",
    challenge:
      "Movement accelerates beyond the conditions your plan was designed for. Which response is most defensible?",
    options: [
      "Assume larger candles guarantee greater profits",
      "Pause, reassess costs and reduce or avoid exposure",
      "Remove stops to survive every swing",
    ],
    correctOption: 1,
    feedback:
      "A plan can have operating limits. Reassessing or staying out is consistent with managing uncertain execution and larger fluctuations.",
    retry:
      "More movement increases the possible loss as well as the possible gain.",
    outcome:
      "Large moves occur in both directions. This sequence is intentionally authored to illustrate uncertainty, not to reproduce an actual news release.",
  },
];

export const scenarios: Scenario[] = definitions.map(
  ({ shape, ...definition }, seed) => {
    const candles = makeCandles(shape, seed + 17);
    if (definition.id === "engulfing") {
      candles[35] = {
        ...candles[35],
        open: price(8),
        close: price(4),
        high: price(9),
        low: price(3),
      };
      candles[36] = {
        ...candles[36],
        open: price(3),
        close: price(10),
        high: price(11),
        low: price(2),
      };
      candles[37].open = candles[36].close;
      candles[37].high = Math.max(candles[37].high, candles[37].open);
    }
    return {
      ...definition,
      candles,
      instrument: "EUR/USD",
      timeframe: "15m",
      startIndex: shape === "up" ? 39 : 37,
      revealIndex: 57,
      spread: definition.spread ?? 0.00012,
    };
  },
);

export const categories = [
  ...new Set(scenarios.map((s) => s.category)),
] as Category[];
export const findScenario = (id: string) =>
  scenarios.find((s) => s.id === id) ?? scenarios[0];
export const pathways = [
  {
    id: "foundations",
    title: "Start with the foundations",
    label: "THE FIRST STEPS",
    description:
      "Get comfortable with candles, trends and the language of a chart.",
    categories: ["Candlestick fundamentals", "Market structure"] as Category[],
    color: "sage",
    icon: "candles",
  },
  {
    id: "price-action",
    title: "Read the bigger picture",
    label: "CONNECT THE DOTS",
    description:
      "Explore the areas, patterns and context behind price movement.",
    categories: [
      "Support & resistance",
      "Liquidity concepts",
      "Fair value gaps",
      "Trends & ranges",
    ] as Category[],
    color: "sand",
    icon: "structure",
  },
  {
    id: "risk",
    title: "Build a thoughtful process",
    label: "THINK BEFORE YOU TRADE",
    description:
      "Practise managing risk, making decisions and learning from them.",
    categories: [
      "Risk management",
      "Trading psychology",
      "Market conditions",
    ] as Category[],
    color: "lavender",
    icon: "risk",
  },
];

export const roadmap = [
  [
    "Candlestick fundamentals",
    "Upper wicks, doji, small bodies, directional candles and wider context",
  ],
  [
    "Market structure",
    "CHoCH, failed breaks, swing confirmation, continuation and reversal",
  ],
  [
    "Support & resistance",
    "Resistance reactions, support flips, false breakdowns and boundaries",
  ],
  [
    "Liquidity concepts",
    "Equal lows, stop-run illustrations, expansion and sweep continuation",
  ],
  [
    "Fair value gaps",
    "Unfilled gaps, partial and full retracement, trend context",
  ],
  [
    "Trends & ranges",
    "Weak trends, contraction, choppy markets and false signals",
  ],
  [
    "Risk management",
    "Reward-to-risk, consecutive losses, commissions and process review",
  ],
  [
    "Trading psychology",
    "Early exits, overtrading, moving stops and ignoring a plan",
  ],
  [
    "Market conditions",
    "Low liquidity, session transitions, slow consolidation and rapid reversals",
  ],
];
