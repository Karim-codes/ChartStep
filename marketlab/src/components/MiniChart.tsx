type Props = { variant?: "candles" | "structure" | "risk"; large?: boolean };
export default function MiniChart({
  variant = "candles",
  large = false,
}: Props) {
  const heights = [27, 36, 24, 47, 32, 54, 42, 66, 52, 73, 61, 87];
  return (
    <svg
      viewBox="0 0 240 112"
      className={`mini-chart ${large ? "large" : ""}`}
      aria-hidden="true"
    >
      {[30, 60, 90].map((y) => (
        <path
          key={y}
          d={`M0 ${y}H240`}
          stroke="currentColor"
          strokeOpacity=".08"
        />
      ))}
      {variant === "candles" ? (
        heights.map((h, i) => {
          const x = 20 + i * 18;
          const up = ![2, 4, 6, 8, 10].includes(i);
          const y = 108 - h;
          return (
            <g key={i} stroke={up ? "#7788df" : "#aeb6d5"}>
              <path d={`M${x} ${y - 10}v40`} strokeWidth="1.2" />
              <rect
                x={x - 4}
                y={y}
                width="8"
                height={up ? 19 : 13}
                rx="1"
                fill={up ? "#7788df" : "#aeb6d5"}
              />
            </g>
          );
        })
      ) : variant === "structure" ? (
        <>
          <path
            d="M14 96 42 65 65 79 96 37 123 57 159 20 185 38 224 6"
            stroke="#6577dd"
            fill="none"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {[
            [42, 65],
            [65, 79],
            [96, 37],
            [123, 57],
            [159, 20],
            [185, 38],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#e9edff"
                stroke="#6577dd"
                strokeWidth="1.5"
              />
              <path
                d={`M${x} ${y}h25`}
                stroke="#6577dd"
                strokeDasharray="3 3"
                strokeOpacity=".4"
              />
            </g>
          ))}
        </>
      ) : (
        <>
          <rect
            x="27"
            y="13"
            width="182"
            height="51"
            rx="2"
            fill="#7585e2"
            fillOpacity=".10"
          />
          <rect
            x="27"
            y="64"
            width="182"
            height="29"
            rx="2"
            fill="#c4989e"
            fillOpacity=".15"
          />
          <path d="M27 64h182" stroke="#697bd7" strokeDasharray="4 3" />
          <path
            d="M38 78 68 53 93 60 123 32 152 42 190 18"
            fill="none"
            stroke="#697bd7"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M27 96h182" stroke="#b393a0" strokeDasharray="3 3" />
          <text
            x="31"
            y="26"
            fill="#697bd7"
            fontSize="8"
            fontFamily="sans-serif"
          >
            A PLAN FOR THE POSSIBILITIES
          </text>
        </>
      )}
    </svg>
  );
}
