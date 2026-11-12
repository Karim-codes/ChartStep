import { useContext, useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesPrimitive,
  type SeriesAttachedParameter,
  type Time,
  type IPrimitivePaneRenderer,
  type IPrimitivePaneView,
  type IPriceLine,
  type CandlestickData,
  type UTCTimestamp,
  type ISeriesMarkersPluginApi,
} from "lightweight-charts";
import {
  Crosshair,
  Minus,
  ScanLine,
  RotateCcw,
  Trash2,
  Moon,
  Sun,
  MousePointer2,
  Check,
  X,
  TrendingUp,
  Undo2,
} from "lucide-react";
import type {
  Annotation,
  Candle,
  Position,
  InstrumentId,
} from "../engine/types";
import { getInstrument, formatPrice } from "../engine/instruments";
import { confirmedSwings } from "../engine/data";
import { ThemeContext } from "../lib/theme";

/** Native series primitive: chart redraws it after zoom, pan, price scaling and resize. */
class PriceRegions implements ISeriesPrimitive<Time> {
  private series?: ISeriesApi<"Candlestick">;
  private chart?: IChartApi;
  private update?: () => void;
  private regions: Annotation[] = [];
  private view: IPrimitivePaneView = {
    renderer: () => this.renderer,
    zOrder: () => "bottom",
  };
  private renderer: IPrimitivePaneRenderer = {
    draw: (target) => {
      target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
        for (const r of this.regions) {
          const a = this.series?.priceToCoordinate(r.price),
            b = this.series?.priceToCoordinate(r.endPrice ?? r.price);
          if (a == null || b == null) continue;
          if (r.kind === "trend") {
            const x = this.chart
                ?.timeScale()
                .timeToCoordinate(r.time as UTCTimestamp),
              endX = this.chart
                ?.timeScale()
                .timeToCoordinate(r.endTime as UTCTimestamp);
            if (x == null || endX == null) continue;
            ctx.strokeStyle = "#7c88ff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, a);
            ctx.lineTo(endX, b);
            ctx.stroke();
            for (const [cx, cy] of [
              [x, a],
              [endX, b],
            ]) {
              ctx.fillStyle = "#7c88ff";
              ctx.beginPath();
              ctx.arc(cx, cy, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            continue;
          }
          const top = Math.min(a, b),
            height = Math.abs(a - b);
          ctx.fillStyle = "rgba(107, 120, 247, 0.12)";
          ctx.fillRect(0, top, mediaSize.width, height);
          ctx.strokeStyle = "rgba(107, 120, 247, 0.75)";
          ctx.setLineDash([5, 4]);
          ctx.strokeRect(0, top, mediaSize.width, height);
          ctx.setLineDash([]);
          ctx.fillStyle = "#6674e8";
          ctx.font = "11px sans-serif";
          ctx.fillText("YOUR PRICE REGION", 12, top + 15);
        }
      });
    },
  };
  attached(p: SeriesAttachedParameter<Time>) {
    this.series = p.series as ISeriesApi<"Candlestick">;
    this.chart = p.chart;
    this.update = p.requestUpdate;
  }
  detached() {
    this.series = undefined;
    this.update = undefined;
  }
  setRegions(regions: Annotation[]) {
    this.regions = regions;
    this.update?.();
  }
  paneViews() {
    return [this.view];
  }
}

type Tool = "cursor" | "level" | "zone" | "trend";
interface Props {
  instrument?: InstrumentId;
  candles: Candle[];
  annotations?: Annotation[];
  onAnnotate?: (a: Annotation) => void;
  onClear?: () => void;
  onUndo?: () => void;
  positions?: Position[];
  index?: number;
  compact?: boolean;
  locked?: boolean;
  resetKey?: number;
}
export default function Chart({
  instrument = "EUR/USD",
  candles,
  annotations = [],
  onAnnotate,
  onClear,
  onUndo,
  positions = [],
  index = 0,
  compact = false,
  locked = false,
  resetKey = 0,
}: Props) {
  const spec = getInstrument(instrument);
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
    chart: IChartApi;
    series: ISeriesApi<"Candlestick">;
    regions: PriceRegions;
    lines: IPriceLine[];
    markers: ISeriesMarkersPluginApi<Time>;
  } | null>(null);
  const callback = useRef({
    onAnnotate,
    index,
    locked,
    tool: "cursor" as Tool,
    first: null as { price: number; time: number } | null,
  });
  const [tool, setTool] = useState<Tool>("cursor");
  const [first, setFirst] = useState<{ price: number; time: number } | null>(
    null,
  );
  const globalTheme = useContext(ThemeContext);
  const [themeOverride, setThemeOverride] = useState<"light" | "dark" | null>(
    null,
  );
  const dark = (themeOverride ?? globalTheme) === "dark";
  const [hover, setHover] = useState<Candle | null>(null);
  const [swings, setSwings] = useState(false);
  const [priceText, setPriceText] = useState("");
  const [endText, setEndText] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  callback.current = { onAnnotate, index, locked, tool, first };
  useEffect(() => {
    if (!host.current) return;
    const chart = createChart(host.current, {
      autoSize: true,
      layout: {
        background: {
          type: ColorType.Solid,
          color: dark ? "#171920" : "#ffffff",
        },
        textColor: dark ? "#adb4c6" : "#737b8d",
        fontFamily: "Inter Variable, sans-serif",
        fontSize: 11,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: dark ? "#282d39" : "#f0f1f5" },
        horzLines: { color: dark ? "#282d39" : "#f0f1f5" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.17, bottom: 0.16 },
        minimumWidth: 68,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: compact ? 8 : 12,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#9098ad", labelBackgroundColor: "#5966ed" },
        horzLine: { color: "#9098ad", labelBackgroundColor: "#5966ed" },
      },
      handleScroll: {
        vertTouchDrag: false,
        horzTouchDrag: true,
        mouseWheel: true,
        pressedMouseMove: true,
      },
      localization: {
        locale: "en-GB",
        priceFormatter: (n: number) => formatPrice(n, instrument),
      },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#4c8b76",
      downColor: "#d98c83",
      borderVisible: false,
      wickUpColor: "#4c8b76",
      wickDownColor: "#d98c83",
      priceLineColor: "#4c8b76",
      priceFormat: {
        type: "price",
        precision: spec.precision,
        minMove: spec.priceStep,
      },
    });
    const regions = new PriceRegions();
    series.attachPrimitive(regions);
    const markers = createSeriesMarkers(series, []);
    api.current = { chart, series, regions, lines: [], markers };
    chart.subscribeCrosshairMove((p) => {
      const d = p.seriesData.get(series) as CandlestickData | undefined;
      setHover(
        d && "open" in d
          ? { ...d, time: typeof d.time === "number" ? d.time : 0 }
          : null,
      );
    });
    chart.subscribeClick((p) => {
      const state = callback.current;
      if (state.locked || state.tool === "cursor" || !p.point) return;
      const price = series.coordinateToPrice(p.point.y);
      if (price === null || price <= 0) return;
      const time = typeof p.time === "number" ? p.time : null;
      if (state.tool === "trend" && time === null) return;
      if (
        (state.tool === "zone" || state.tool === "trend") &&
        state.first === null
      ) {
        setFirst({ price, time: time ?? 0 });
        return;
      }
      state.onAnnotate?.({
        id: crypto.randomUUID(),
        kind: state.tool,
        price: Number(price.toFixed(spec.precision)),
        endPrice: state.tool !== "level" ? state.first?.price : undefined,
        time: time ?? undefined,
        endTime: state.first?.time,
        createdAt: state.index,
      });
      setFirst(null);
      setTool("cursor");
    });
    return () => {
      api.current = null;
      chart.remove();
    };
  }, [dark, compact, instrument]);
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const previousLength = a.series.data().length;
    const initial = previousLength === 0;
    const range = a.chart.timeScale().getVisibleLogicalRange();
    const follow = range !== null && range.to >= previousLength - 2;
    a.series.setData(
      candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })),
    );
    if (initial) a.chart.timeScale().fitContent();
    else if (follow && candles.length > previousLength)
      a.chart.timeScale().scrollToRealTime();
    setHover(null);
  }, [candles, dark, compact, instrument]);
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    a.lines.forEach((l) => a.series.removePriceLine(l));
    a.lines = annotations
      .filter((n) => n.kind === "level")
      .map((n) =>
        a.series.createPriceLine({
          price: n.price,
          color: "#7c88ff",
          lineStyle: LineStyle.Dashed,
          lineWidth: 2,
          axisLabelVisible: true,
          title: "Your level",
        }),
      );
    for (const [i, p] of positions.entries()) {
      const lines: [number, string, string][] = [
        [p.entry, `${p.side.toUpperCase()} ${i + 1}`, "#7987ed"],
        [p.stop, `SL ${i + 1}`, "#c38d7a"],
        [p.target, `TP ${i + 1}`, "#89a970"],
      ];
      a.lines.push(
        ...lines.map(([price, title, color]) =>
          a.series.createPriceLine({
            price,
            title,
            color,
            lineStyle: LineStyle.Dotted,
            lineWidth: 1,
            axisLabelVisible: true,
          }),
        ),
      );
    }
    a.regions.setRegions(annotations.filter((n) => n.kind !== "level"));
  }, [annotations, positions, dark, compact, instrument]);
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    a.markers.setMarkers(
      swings
        ? confirmedSwings(candles).map((p) => ({
            time: candles[p.index].time as UTCTimestamp,
            position:
              p.kind === "high" ? ("aboveBar" as const) : ("belowBar" as const),
            color: "#7c88ff",
            shape: "circle" as const,
            text: p.kind === "high" ? "High" : "Low",
            size: 0.6,
          }))
        : [],
    );
  }, [candles, swings, dark, compact, instrument]);
  useEffect(() => {
    api.current?.chart.timeScale().fitContent();
  }, [resetKey]);
  useEffect(() => {
    if (locked) {
      setTool("cursor");
      setFirst(null);
    }
  }, [locked]);
  useEffect(() => {
    setThemeOverride(null);
  }, [globalTheme]);
  const current = hover ?? candles.at(-1);
  const selectTool = (next: Tool) => {
    setTool(next);
    setFirst(null);
    setPriceText("");
    setEndText("");
    setStartTime(String(candles[Math.max(0, candles.length - 10)]?.time ?? 0));
    setEndTime(String(candles.at(-1)?.time ?? 0));
  };
  function numericAnnotation() {
    const p = Number(priceText),
      end = Number(endText);
    if (
      !(p > 0) ||
      !Number.isFinite(p) ||
      ((tool === "zone" || tool === "trend") &&
        (!(end > 0) || !Number.isFinite(end)))
    )
      return;
    onAnnotate?.({
      id: crypto.randomUUID(),
      kind: tool === "trend" ? "trend" : tool === "zone" ? "zone" : "level",
      price: p,
      endPrice: tool !== "level" ? end : undefined,
      time: tool === "trend" ? Number(startTime) : undefined,
      endTime: tool === "trend" ? Number(endTime) : undefined,
      createdAt: index,
    });
    setTool("cursor");
    setFirst(null);
  }
  return (
    <div
      className={`chart-component ${dark ? "dark-chart" : ""} ${compact ? "compact-chart" : ""}`}
    >
      <div className="chart-top">
        <div className="chart-symbol">
          <span className="instrument-dot">{spec.symbol}</span>
          <strong>{spec.id}</strong>
          {spec.group === "Metals" && (
            <span className="market-name">{spec.name}</span>
          )}
          <span className="chart-interval">15m</span>
          <span className="synthetic-label">
            <i /> Synthetic data
          </span>
        </div>
        <div className="chart-ohlc" aria-label="Candle prices">
          {current &&
            (["open", "high", "low", "close"] as const).map((k) => (
              <span key={k}>
                {k[0].toUpperCase()}{" "}
                <b>{formatPrice(current[k], instrument)}</b>
              </span>
            ))}
        </div>
      </div>
      {!compact && (
        <div
          className="chart-toolbar"
          role="toolbar"
          aria-label="Chart drawing tools"
        >
          <button
            aria-label="Pan and inspect chart"
            className={tool === "cursor" ? "selected" : ""}
            onClick={() => selectTool("cursor")}
          >
            <MousePointer2 size={16} />
            <span>Inspect</span>
          </button>
          <button
            aria-label="Horizontal level"
            disabled={locked}
            className={tool === "level" ? "selected" : ""}
            onClick={() => selectTool("level")}
          >
            <Minus size={17} />
            <span>Horizontal level</span>
          </button>
          <button
            aria-label="Price region"
            disabled={locked}
            className={tool === "zone" ? "selected" : ""}
            onClick={() => selectTool("zone")}
          >
            <ScanLine size={16} />
            <span>Price region</span>
          </button>
          <button
            aria-label="Trend line"
            disabled={locked}
            className={tool === "trend" ? "selected" : ""}
            onClick={() => selectTool("trend")}
          >
            <TrendingUp size={16} />
            <span>Trend line</span>
          </button>
          <div className="toolbar-divider" />
          <button
            aria-label="Show confirmed swings"
            aria-pressed={swings}
            className={swings ? "selected" : ""}
            onClick={() => setSwings(!swings)}
          >
            <Crosshair size={16} />
            <span>Swings</span>
          </button>
          <div className="toolbar-spacer" />
          <button
            aria-label="Reset chart view"
            onClick={() => api.current?.chart.timeScale().fitContent()}
          >
            <RotateCcw size={16} />
          </button>
          <button
            disabled={locked || annotations.length === 0}
            aria-label="Clear annotations"
            onClick={() => {
              onClear?.();
              setFirst(null);
            }}
          >
            <Trash2 size={16} />
          </button>
          <button
            disabled={locked || annotations.length === 0}
            aria-label="Undo last drawing"
            onClick={onUndo}
          >
            <Undo2 size={16} />
          </button>
          <button
            aria-label={dark ? "Use light chart" : "Use dark chart"}
            onClick={() => setThemeOverride(dark ? "light" : "dark")}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      )}
      {tool !== "cursor" && !compact && (
        <div className="annotation-entry">
          <span>
            {tool === "trend"
              ? first
                ? "Tap a second candle to finish the line."
                : "Tap two candles, or enter endpoint prices:"
              : tool === "zone"
                ? first
                  ? "Tap the second edge."
                  : "Tap two price edges, or enter both prices:"
                : "Tap a price, or enter a level:"}
          </span>
          <input
            aria-label="Annotation price"
            type="number"
            step={spec.priceStep}
            placeholder={formatPrice(spec.referencePrice, instrument)}
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
          />
          {(tool === "zone" || tool === "trend") && (
            <input
              aria-label={
                tool === "trend" ? "Trend second price" : "Region second price"
              }
              type="number"
              step={spec.priceStep}
              placeholder={formatPrice(
                spec.referencePrice + spec.stopDistance,
                instrument,
              )}
              value={endText}
              onChange={(e) => setEndText(e.target.value)}
            />
          )}
          {tool === "trend" && (
            <>
              <select
                aria-label="Trend start candle"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {candles.map((c, i) => (
                  <option key={c.time} value={c.time}>
                    Start: candle {i + 1}
                  </option>
                ))}
              </select>
              <select
                aria-label="Trend end candle"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {candles.map((c, i) => (
                  <option key={c.time} value={c.time}>
                    End: candle {i + 1}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            className="icon-button"
            aria-label="Add annotation"
            onClick={numericAnnotation}
          >
            <Check size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Cancel annotation"
            onClick={() => selectTool("cursor")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div
        ref={host}
        className={`chart-canvas ${tool !== "cursor" ? "drawing" : ""}`}
        aria-label={`Interactive ${instrument} candlestick chart, ${candles.length} revealed candles`}
        role="img"
      />
      <div className="chart-caption">
        <span>
          {compact
            ? "A small preview. A bigger understanding."
            : "Drag to pan · Scroll or pinch to zoom · Inspect a candle for its prices"}
        </span>
        <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">
          Charts by TradingView
        </a>
      </div>
    </div>
  );
}
