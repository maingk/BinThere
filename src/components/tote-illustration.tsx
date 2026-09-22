/**
 * Original cartoon of a latching storage tote: blue lid, translucent body,
 * QR label on the front. Drawn rather than traced from a product photo, so
 * the app carries no third-party product photography or branding. Being SVG,
 * it stays crisp at any size, themes for dark mode, and costs about 2KB.
 */

// A 5x5 block that still reads as a QR code at thumbnail size.
const QR_PATTERN = [
  [1, 1, 0, 1, 1],
  [1, 0, 0, 0, 1],
  [0, 0, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1],
];

const CELL = 5;
const STEP = 6.5;
const QR_X = 84.5;
const QR_Y = 91.5;

/*
 * The beam sweeps the code itself, not the label's padding. Derived from the
 * grid so the two cannot drift apart: hardcoding the travel let the beam run
 * past the last row and clip against the label edge.
 */
const GRID_BOTTOM = QR_Y + 4 * STEP + CELL;
const BEAM_START = QR_Y - 3;
const BEAM_TRAVEL = GRID_BOTTOM - BEAM_START;
const BEAM_GLOW_HEIGHT = 13;

export function ToteIllustration({
  className,
  title = "A storage tote with a QR label on the front",
  decorative = false,
  scan = false,
  instanceId = "tote",
}: {
  className?: string;
  title?: string;
  /** Background use: hidden from screen readers, which would only hear noise. */
  decorative?: boolean;
  /** Sweep a scan line across the label. Respects prefers-reduced-motion. */
  scan?: boolean;
  /** Distinguishes the SVG's internal ids if two instances share a page. */
  instanceId?: string;
}) {
  const tubClip = `${instanceId}-tub`;
  const labelClip = `${instanceId}-label`;
  const scanGradient = `${instanceId}-scan`;

  return (
    <svg
      viewBox="0 0 200 170"
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "img", "aria-label": title })}
      className={className}
    >
      {/* Ground shadow, so it sits rather than floats. */}
      <ellipse
        cx="100"
        cy="142"
        rx="54"
        ry="6"
        className="fill-slate-400/25 dark:fill-slate-100/10"
      />

      <defs>
        {/* Keeps the contents inside the tub, like real translucent plastic. */}
        <clipPath id={tubClip}>
          <path d="M48 64 H152 L147 128 a9 9 0 0 1 -9 8 H62 a9 9 0 0 1 -9 -8 Z" />
        </clipPath>
        <clipPath id={labelClip}>
          <rect x="76" y="86" width="48" height="42" rx="6" />
        </clipPath>
        {/*
          currentColor inside gradient stops resolves against the gradient
          element itself, not the shape referencing it, so the colour has to
          be set here rather than on the <g> that uses the fill.
        */}
        <linearGradient
          id={scanGradient}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
          className="text-primary"
        >
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Tub. */}
      <path
        d="M48 64 H152 L147 128 a9 9 0 0 1 -9 8 H62 a9 9 0 0 1 -9 -8 Z"
        className="fill-slate-300/35 dark:fill-slate-200/10"
      />

      {/* Contents showing through the front, tucked behind the label. */}
      <g clipPath={`url(#${tubClip})`} className="opacity-80">
        <rect
          x="60"
          y="72"
          width="36"
          height="17"
          rx="4"
          transform="rotate(-3 78 80)"
          className="fill-[#C9A227]/70"
        />
        <rect
          x="102"
          y="75"
          width="34"
          height="15"
          rx="4"
          transform="rotate(2 119 82)"
          className="fill-[#5F8F6B]/70"
        />
        <rect
          x="58"
          y="96"
          width="30"
          height="26"
          rx="4"
          className="fill-[#B2604C]/55"
        />
        <rect
          x="116"
          y="100"
          width="28"
          height="22"
          rx="4"
          className="fill-[#5B7FA3]/55"
        />
      </g>

      {/* Moulded ribs, kept clear of the label. */}
      <g
        clipPath={`url(#${tubClip})`}
        className="stroke-slate-400/35 dark:stroke-slate-400/20"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M64 68 L61 132" />
        <path d="M136 68 L139 132" />
      </g>

      {/* Tub outline drawn over the contents so the rim stays crisp. */}
      <path
        d="M48 64 H152 L147 128 a9 9 0 0 1 -9 8 H62 a9 9 0 0 1 -9 -8 Z"
        className="fill-none stroke-slate-400/70 dark:stroke-slate-400/45"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* The label: the whole point of the app, so it gets centre stage. */}
      <rect
        x="76"
        y="86"
        width="48"
        height="42"
        rx="6"
        className={`fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-600 ${
          scan ? "tote-scan-frame" : ""
        }`}
        strokeWidth="2"
      />
      <g className="fill-slate-800 dark:fill-slate-200">
        {QR_PATTERN.flatMap((row, r) =>
          row.map((on, c) =>
            on ? (
              <rect
                key={`${r}-${c}`}
                x={QR_X + c * STEP}
                y={QR_Y + r * STEP}
                width={CELL}
                height={CELL}
                rx="1.2"
              />
            ) : null,
          ),
        )}
      </g>

      {/* The scan sweep, clipped so it only ever travels across the label. */}
      {scan ? (
        <g
          clipPath={`url(#${labelClip})`}
          className="tote-scan-line"
          style={
            { "--tote-scan-travel": `${BEAM_TRAVEL}px` } as React.CSSProperties
          }
        >
          <rect
            x="76"
            y={BEAM_START + 0.6 - BEAM_GLOW_HEIGHT / 2}
            width="48"
            height={BEAM_GLOW_HEIGHT}
            fill={`url(#${scanGradient})`}
          />
          <rect
            x="76"
            y={BEAM_START}
            width="48"
            height="1.2"
            className="fill-primary"
          />
        </g>
      ) : null}

      {/* Lid, overhanging the tub on both sides. */}
      <path
        d="M36 44 H164 a6 6 0 0 1 6 6 v8 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 v-8 a6 6 0 0 1 6 -6 Z"
        className="fill-primary"
      />
      {/* Moulded lip along the bottom edge, and a highlight along the top. */}
      <path
        d="M38 61 H162"
        className="stroke-black/25"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M44 49 H156"
        className="stroke-white/40"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
