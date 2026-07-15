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
  if (status === "critical") return { fill: "rgba(217,99,92,0.1)", stroke: "#d9635c", text: "#e8a09c" };
  if (status === "watch") return { fill: "rgba(201,160,69,0.08)", stroke: "#c9a045", text: "#d4bc82" };
  return { fill: "rgba(66,184,131,0.08)", stroke: "#42b883", text: "#8fd4b5" };
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
    <div className="well w-full overflow-hidden">
      <svg viewBox="0 0 540 410" className="h-auto w-full" role="img" aria-label="Fairgrounds dependency map">
        <defs>
          <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="540" height="410" fill="url(#grid)" />

        <path
          d="M145 300 V250 H330 V196"
          fill="none"
          stroke={critical ? "#d9635c" : "#4a8ae8"}
          strokeWidth="1.5"
          className="flow-line"
          opacity="0.5"
        />
        <path
          d="M145 300 V162 H105"
          fill="none"
          stroke={critical ? "#d9635c" : "#4a8ae8"}
          strokeWidth="1.5"
          className="flow-line"
          opacity="0.35"
        />
        <path
          d="M145 300 H385 V162"
          fill="none"
          stroke={critical ? "#d9635c" : "#4a8ae8"}
          strokeWidth="1.5"
          className="flow-line"
          opacity="0.25"
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
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="8"
                fill={p.fill}
                stroke={p.stroke}
                strokeWidth={interactive ? 1.5 : 1}
              />
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2 + (interactive ? -2 : 4)}
                textAnchor="middle"
                fontSize={interactive ? "12" : "11"}
                fontWeight="500"
                fill={p.text}
                fontFamily="var(--font-sans), system-ui, sans-serif"
              >
                {z.label}
              </text>
              {interactive && (
                <text
                  x={z.x + z.w / 2}
                  y={z.y + z.h - 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill={p.text}
                  opacity="0.7"
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                >
                  inspect
                </text>
              )}
            </g>
          );
        })}
        <text x="30" y="400" fontSize="10" fill="#6b7383" fontFamily="var(--font-sans), system-ui, sans-serif">
          Gate 1 links transit, ticketing, screening & network
        </text>
      </svg>
    </div>
  );
}
