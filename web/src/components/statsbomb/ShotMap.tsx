import type { StatsBombShot } from "../../lib/types";

interface ShotMapProps {
  shots: StatsBombShot[];
}

// StatsBomb pitch: 120 x 80 units
// SVG: 600 x 400 (same 3:2 ratio)
const SVG_W = 600;
const SVG_H = 400;
const SCALE_X = SVG_W / 120;
const SCALE_Y = SVG_H / 80;

function toSvgX(sbX: number): number {
  return sbX * SCALE_X;
}
function toSvgY(sbY: number): number {
  return SVG_H - sbY * SCALE_Y; // flip Y so bottom of pitch = y=0
}

const OUTCOME_COLORS: Record<string, string> = {
  goal: "#10b981", // emerald-500
  saved: "#3b82f6", // blue-500
  blocked: "#8b5cf6", // violet-500
  off_target: "#6b7280", // gray-500
  wayward: "#6b7280", // gray-500
};

interface DotInfo {
  x: number;
  y: number;
  outcome: string;
}

export function ShotMap({ shots }: ShotMapProps) {
  const goalShots = shots.filter((s) => s.outcome === "goal");
  const nonGoalShots = shots.filter((s) => s.outcome !== "goal");

  if (shots.length === 0) return null;

  const dots: DotInfo[] = shots.map((s) => ({
    x: toSvgX(s.x),
    y: toSvgY(s.y),
    outcome: s.outcome,
  }));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
      <h3 className="font-semibold text-zinc-300 mb-4">Mapa de tiros</h3>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-lg mx-auto"
        role="img"
        aria-label="Shot map"
      >
        {/* Pitch outline */}
        <rect
          x={0}
          y={0}
          width={SVG_W}
          height={SVG_H}
          fill="#1a1a2e"
          stroke="#333"
          strokeWidth={2}
        />
        {/* Centre line */}
        <line
          x1={SVG_W / 2}
          y1={0}
          x2={SVG_W / 2}
          y2={SVG_H}
          stroke="#333"
          strokeWidth={2}
        />
        {/* Centre circle */}
        <circle
          cx={SVG_W / 2}
          cy={SVG_H / 2}
          r={SVG_H * 0.2}
          fill="none"
          stroke="#333"
          strokeWidth={2}
        />
        {/* Left penalty area */}
        <rect
          x={0}
          y={SVG_H * 0.2}
          width={SVG_W * 0.16}
          height={SVG_H * 0.6}
          fill="none"
          stroke="#333"
          strokeWidth={2}
        />
        {/* Right penalty area */}
        <rect
          x={SVG_W * 0.84}
          y={SVG_H * 0.2}
          width={SVG_W * 0.16}
          height={SVG_H * 0.6}
          fill="none"
          stroke="#333"
          strokeWidth={2}
        />
        {/* Left goal */}
        <rect
          x={-4}
          y={SVG_H * 0.35}
          width={4}
          height={SVG_H * 0.3}
          fill="none"
          stroke="#333"
          strokeWidth={3}
        />
        {/* Right goal */}
        <rect
          x={SVG_W}
          y={SVG_H * 0.35}
          width={4}
          height={SVG_H * 0.3}
          fill="none"
          stroke="#333"
          strokeWidth={3}
        />

        {/* Shot dots */}
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dot.outcome === "goal" ? 5 : 4}
            fill={OUTCOME_COLORS[dot.outcome] ?? "#6b7280"}
            opacity={0.8}
            stroke={dot.outcome === "goal" ? "#fff" : "none"}
            strokeWidth={dot.outcome === "goal" ? 1 : 0}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Gol ({goalShots.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Atajado ({shots.filter((s) => s.outcome === "saved").length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          <span>Bloqueado ({shots.filter((s) => s.outcome === "blocked").length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
          <span>Desviado ({shots.filter((s) => s.outcome === "off_target" || s.outcome === "wayward").length})</span>
        </div>
      </div>
    </div>
  );
}

export default ShotMap;
