import { brand } from "../lib/config";

/** An open chart frame around two measured steps; deliberately no arrowhead. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`chartstep-mark ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M27 5H5v22h22M12 21v-6h8v-5h7"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function BrandWordmark({ footer = false }: { footer?: boolean }) {
  return (
    <span className={`lp-wordmark ${footer ? "lp-wordmark-footer" : ""}`}>
      <span className="lp-mark">
        <BrandMark />
      </span>
      {brand.name}
    </span>
  );
}
