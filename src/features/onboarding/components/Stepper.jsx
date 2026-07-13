import { useRef, useEffect } from "react";
import { Check, Lock } from "lucide-react";

/**
 * Stepper — horizontal progress indicator.
 *
 * Status values per step:
 *   - "completed"   → green filled circle w/ check, green connector
 *   - "in_progress" → orange circle, partially-filled orange connector
 *   - "pending"     → gray circle w/ dot-grid, gray connector
 *
 * Each step: { label, title, status }
 *
 * Props:
 *   steps        array   — step objects
 *   activeIndex  number  — index of the current step (used to auto-pan)
 *
 * Responsive behaviour:
 *   - Up to `lg` the steps keep a minimum width, so all 8 overflow the row and
 *     the container scrolls horizontally (the active step auto-pans into view).
 *   - From `lg` up the steps drop their min-width and flex to fill the full row,
 *     so the whole stepper stays horizontal on desktop with no scrolling.
 *
 * Tailwind note: structural styling (layout, sizing, type) is in classes;
 * the status-driven colors and the connector fill width are computed at
 * runtime, so those necessarily stay as inline `style`.
 */

const STATUS = {
  completed: {
    badge: "Completed",
    ring: "var(--stepper-green)",
    bg: "var(--stepper-green)",
    pill: { bg: "rgba(16,185,129,0.12)", text: "var(--stepper-green)" },
  },
  in_progress: {
    badge: "In Progress",
    ring: "var(--stepper-orange)",
    bg: "var(--stepper-orange)",
    pill: { bg: "rgba(249,115,22,0.10)", text: "var(--stepper-orange)" },
  },
  pending: {
    badge: "Pending",
    ring: "var(--stepper-gray)",
    bg: "transparent",
    pill: { bg: "transparent", text: "var(--stepper-gray-text)" },
  },
};

// Dot-grid (3×3) shown inside pending circles
function DotGrid({ color }) {
  const dots = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      dots.push(
        <circle key={`${r}-${c}`} cx={4 + c * 5} cy={4 + r * 5} r={1.4} fill={color} />
      );
    }
  }
  return (
    <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-[18px] lg:w-[18px]" viewBox="0 0 18 18" aria-hidden="true">
      {dots}
    </svg>
  );
}

function StepCircle({ status }) {
  const isCompleted  = status === "completed";
  const isInProgress = status === "in_progress";

  const ring = STATUS[status]?.ring ?? STATUS.pending.ring;
  const bg   = STATUS[status]?.bg   ?? STATUS.pending.bg;

  const halo = isCompleted
    ? "0 0 0 4px rgba(16,185,129,0.15)"
    : isInProgress
    ? "0 0 0 4px rgba(249,115,22,0.15)"
    : "none";

  return (
    <div
      className="flex h-4.5 w-4.5 sm:h-5 sm:w-5 lg:h-6.25 lg:w-6.25 flex-[0_0_auto] items-center justify-center rounded-full box-border transition-all duration-250"
      style={{ background: bg, border: `1px solid ${ring}`, boxShadow: halo }}
    >
      {isCompleted  && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" strokeWidth={3}   color="#fff" />}
      {isInProgress && <Lock  className="h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-3.5 lg:w-3.5" strokeWidth={2.5} color="#fff" />}
      {!isCompleted && !isInProgress && (
        <DotGrid color="var(--stepper-gray)" />
      )}
    </div>
  );
}

// Connector line between two steps — `fill` 0..1 controls coloured portion.
function Connector({ fill = 0, color = "var(--stepper-green)" }) {
  return (
    <div className="relative mx-1.5 h-1 min-w-[12px] sm:min-w-[18px] lg:min-w-[24px] flex-1 overflow-hidden rounded-sm bg-(--stepper-track)">
      <div
        className="absolute bottom-0 left-0 top-0 rounded-sm transition-[width] duration-350"
        style={{ width: `${Math.max(0, Math.min(1, fill)) * 100}%`, background: color }}
      />
    </div>
  );
}

export default function Stepper({ steps = [], activeIndex = 0 }) {
  /* Outer container ref — we scroll it programmatically, never the user */
  const containerRef = useRef(null);
  /* One ref per step item so we can measure its position */
  const stepRefs = useRef([]);

  /* Pan to keep the active step centred whenever it changes.
     On desktop the row fits with no overflow, so scrollTo is a harmless no-op. */
  useEffect(() => {
    const container = containerRef.current;
    const activeEl  = stepRefs.current[activeIndex];
    if (!container || !activeEl) return;

    const containerW = container.offsetWidth;
    const elLeft     = activeEl.offsetLeft;
    const elW        = activeEl.offsetWidth;

    // Target scrollLeft that puts the active step in the centre of the viewport
    const target = elLeft - containerW / 2 + elW / 2;

    container.scrollTo({ left: target, behavior: "smooth" });
  }, [activeIndex]);

  const connectorFor = (index) => {
    const current = steps[index]?.status;
    if (current === "completed")  return { fill: 1,    color: "var(--stepper-green)"  };
    if (current === "in_progress") return { fill: 0.45, color: "var(--stepper-orange)" };
    return { fill: 0, color: "var(--stepper-track)" };
  };

  return (
    <div
      ref={containerRef}
      /* Scrolls on small screens (no-scrollbar hides the bar; scroll is JS-driven);
         from lg up there's no overflow, so it just sits horizontally. */
      className="no-scrollbar box-border w-full overflow-x-auto pb-1 lg:overflow-x-visible"
      style={{
        /* ── CSS custom properties consumed by the inline styles below ── */
        "--stepper-green":     "#10b981",
        "--stepper-orange":    "#f97316",
        "--stepper-gray":      "#cbd5e1",
        "--stepper-gray-text": "#94a3b8",
        "--stepper-track":     "#e2e8f0",
        "--stepper-title":     "#1e293b",
        "--stepper-caption":   "#94a3b8",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* min-w-min so steps never wrap while scrolling on small screens;
          lg:min-w-full lets them flex to fill the row on desktop. */}
      <div className="flex min-w-min lg:min-w-full items-start px-1.5 pt-1.5">
        {steps.map((step, i) => {
          const cfg    = STATUS[step.status] ?? STATUS.pending;
          const conn   = connectorFor(i);
          const isLast = i === steps.length - 1;

          return (
            <div
              key={i}
              ref={(el) => (stepRefs.current[i] = el)}
              /* Fixed-ish min-width forces overflow→scroll on small screens;
                 lg:min-w-0 lets the flex children shrink to fit on desktop. */
              className="flex min-w-[6.5rem] sm:min-w-[7.5rem] lg:min-w-0 flex-[1_1_0] flex-col items-start"
            >
              {/* Circle + trailing connector in one row */}
              <div className="flex w-full items-center">
                <StepCircle status={step.status} />
                {!isLast && <Connector fill={conn.fill} color={conn.color} />}
              </div>

               {/* Caption */}
              <div className="mt-2 lg:mt-4 text-[0.625rem] sm:text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-(--stepper-caption)">
                {step.label}
              </div>
 
              {/* Title — nowrap while scrolling on mobile; allowed to wrap on
                  desktop where the columns are narrower. Scales up on xl. */}
              <div className="mt-0.5 lg:mt-1 whitespace-nowrap lg:whitespace-normal text-[11px] sm:text-[0.8125rem] md:text-[0.9375rem] xl:text-base font-bold text-(--stepper-title)">
                {step.title}
              </div>
 
              {/* Status pill — hidden on mobile to limit stepper height to 80px, colors are status-driven */}
              <div
                className="hidden lg:block mt-2.5 whitespace-nowrap rounded-full px-2 py-0.5 sm:px-3 sm:py-0.75 text-[0.6875rem] sm:text-[0.75rem] font-semibold"
                style={{
                  background: cfg.pill.bg,
                  color: cfg.pill.text,
                  border:
                    step.status === "pending"
                      ? "1px solid var(--stepper-track)"
                      : step.status === "in_progress"
                      ? "1px solid var(--stepper-orange)"
                      : "none",
                }}
              >
                {cfg.badge}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
