"use client";

import type { ScenarioSnapshot } from "@/lib/types";

const ZONES: { id: string; label: string; x: number; y: number; w: number; h: number }[] = [
  { id: "north_parking", label: "North Parking", x: 180, y: 24, w: 280, h: 56 },
  { id: "alternate_east", label: "Alternate East Gate", x: 24, y: 110, w: 160, h: 70 },
  { id: "midway", label: "Midway", x: 210, y: 110, w: 140, h: 70 },
  { id: "livestock", label: "Livestock", x: 380, y: 110, w: 140, h: 70 },
  { id: "central_fair", label: "Central Fair", x: 180, y: 210, w: 280, h: 70 },
  { id: "gate_1", label: "Gate 1 / Transit Hub", x: 24, y: 310, w: 220, h: 90 },
  { id: "food_zone", label: "Food Zone", x: 280, y: 320, w: 180, h: 70 },
];

function fillFor(status: string) {
  if (status === "critical") return "rgba(199,54,45,0.18)";
  if (status === "watch") return "rgba(196,127,0,0.16)";
  return "rgba(46,139,87,0.12)";
}

function strokeFor(status: string) {
  if (status === "critical") return "#c7362d";
  if (status === "watch") return "#c47f00";
  return "#2e8b57";
}

export function FairgroundsMap({
  snapshot,
  onSelectGate,
}: {
  snapshot: ScenarioSnapshot;
  onSelectGate: () => void;
}) {
  const zones = snapshot.map_zones;
  return (
    <div className="w-full overflow-hidden rounded-md border border-[var(--border)] bg-[#f7f9fb]">
      <svg viewBox="0 0 560 430" className="h-auto w-full" role="img" aria-label="Fairgrounds dependency map">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(13,39,77,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="560" height="430" fill="url(#grid)" />
        {/* Dependency links into Gate 1 */}
        <path d="M134 310 V250 H320" fill="none" stroke="#049fd9" strokeWidth="2" strokeDasharray="4 4" opacity="0.55" />
        <path d="M134 310 V180 H104" fill="none" stroke="#049fd9" strokeWidth="2" strokeDasharray="4 4" opacity="0.45" />
        {ZONES.map((z) => {
          const status = zones[z.id] || "healthy";
          const interactive = z.id === "gate_1" || z.id === "transit_hub";
          return (
            <g
              key={z.id}
              onClick={interactive ? onSelectGate : undefined}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="8"
                fill={fillFor(status)}
                stroke={strokeFor(status)}
                strokeWidth={interactive ? 2.5 : 1.5}
              />
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2 + 4}
                textAnchor="middle"
                fontSize="13"
                fontWeight="600"
                fill="#0d274d"
              >
                {z.label}
              </text>
            </g>
          );
        })}
        <text x="28" y="410" fontSize="11" fill="#5c6770">
          Event dependency map · Gate 1 links transit, ticketing, screening, and network
        </text>
      </svg>
    </div>
  );
}
