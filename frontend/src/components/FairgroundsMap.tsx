"use client";

import type { ScenarioSnapshot } from "@/lib/types";

const ZONES: { id: string; label: string; x: number; y: number; w: number; h: number }[] = [
  { id: "north_parking", label: "North Parking", x: 200, y: 20, w: 260, h: 48 },
  { id: "alternate_east", label: "Alt. East Gate", x: 30, y: 100, w: 150, h: 62 },
  { id: "midway", label: "Midway", x: 220, y: 100, w: 130, h: 62 },
  { id: "livestock", label: "Livestock", x: 380, y: 100, w: 130, h: 62 },
  { id: "central_fair", label: "Central Fair", x: 200, y: 196, w: 260, h: 60 },
  { id: "gate_1", label: "Gate 1 · Transit Hub", x: 30, y: 300, w: 230, h: 86 },
  { id: "food_zone", label: "Food Zone", x: 300, y: 306, w: 170, h: 62 },
];

function palette(status: string) {
  if (status === "critical") return { fill: "rgba(251,90,104,0.16)", stroke: "#fb5a68", text: "#ffd9dc" };
  if (status === "watch") return { fill: "rgba(251,191,36,0.14)", stroke: "#fbbf24", text: "#fde9b8" };
  return { fill: "rgba(52,211,153,0.10)", stroke: "#34d399", text: "#c7f5e4" };
}

export function FairgroundsMap({
  snapshot,
  onSelectGate,
}: {
  snapshot: ScenarioSnapshot;
  onSelectGate: () => void;
}) {
  const zones = snapshot.map_zones;
  const gateStatus = zones["gate_1"] || "healthy";
  const critical = gateStatus === "critical";

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[rgba(6,11,24,0.6)]">
      <svg viewBox="0 0 540 410" className="h-auto w-full" role="img" aria-label="Fairgrounds dependency map">
        <defs>
          <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(148,170,220,0.06)" strokeWidth="1" />
          </pattern>
          <linearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22a7f0" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect width="540" height="410" fill="url(#grid)" />

        {/* Dependency links converging on Gate 1 */}
        <path
          d="M145 300 V250 H330 V196"
          fill="none"
          stroke={critical ? "#fb5a68" : "url(#flow)"}
          strokeWidth="2"
          className="flow-line"
          opacity="0.7"
        />
        <path
          d="M145 300 V162 H105"
          fill="none"
          stroke={critical ? "#fb5a68" : "url(#flow)"}
          strokeWidth="2"
          className="flow-line"
          opacity="0.6"
        />
        <path
          d="M145 300 H385 V162"
          fill="none"
          stroke={critical ? "#fb5a68" : "url(#flow)"}
          strokeWidth="2"
          className="flow-line"
          opacity="0.45"
        />

        {ZONES.map((z) => {
          const status = zones[z.id] || "healthy";
          const p = palette(status);
          const interactive = z.id === "gate_1";
          return (
            <g
              key={z.id}
              onClick={interactive ? onSelectGate : undefined}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              {interactive && critical && (
                <rect
                  x={z.x - 4}
                  y={z.y - 4}
                  width={z.w + 8}
                  height={z.h + 8}
                  rx="14"
                  fill="none"
                  stroke="#fb5a68"
                  strokeWidth="1.5"
                  opacity="0.5"
                >
                  <animate attributeName="opacity" values="0.5;0.05;0.5" dur="1.6s" repeatCount="indefinite" />
                </rect>
              )}
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="12"
                fill={p.fill}
                stroke={p.stroke}
                strokeWidth={interactive ? 2 : 1.25}
              />
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2 + 4}
                textAnchor="middle"
                fontSize={interactive ? "13" : "12"}
                fontWeight="700"
                fill={p.text}
              >
                {z.label}
              </text>
              {interactive && (
                <text x={z.x + z.w / 2} y={z.y + z.h - 10} textAnchor="middle" fontSize="9" fill={p.text} opacity="0.8">
                  click to inspect →
                </text>
              )}
            </g>
          );
        })}
        <text x="30" y="400" fontSize="10.5" fill="#6b7893">
          Dependency map · Gate 1 links transit, ticketing, screening &amp; network
        </text>
      </svg>
    </div>
  );
}
