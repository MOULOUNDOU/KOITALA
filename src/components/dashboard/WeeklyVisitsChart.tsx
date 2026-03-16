"use client";

import { useState } from "react";

interface WeeklyVisitPoint {
  label: string;
  total: number;
}

interface WeeklyVisitsChartProps {
  data: WeeklyVisitPoint[];
}

function buildSmoothLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export default function WeeklyVisitsChart({ data }: WeeklyVisitsChartProps) {
  const chartWidth = 640;
  const chartHeight = 250;
  const chartPadding = { top: 20, right: 18, bottom: 44, left: 40 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const chartMaxValue = Math.max(...data.map((point) => point.total), 1);
  const baselineY = chartPadding.top + innerHeight;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartPoints = data.map((point, index) => {
    const x =
      data.length === 1
        ? chartPadding.left + innerWidth / 2
        : chartPadding.left + (index * innerWidth) / (data.length - 1);
    const y = baselineY - (point.total / chartMaxValue) * innerHeight;

    return { x, y, ...point };
  });

  const linePath = buildSmoothLinePath(chartPoints);
  const areaPath =
    chartPoints.length > 1
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${baselineY} L ${chartPoints[0].x} ${baselineY} Z`
      : "";

  const yTicks = [chartMaxValue, Math.round(chartMaxValue / 2), 0];
  const hoverZones = chartPoints.map((point, index) => {
    const prevPoint = chartPoints[index - 1];
    const nextPoint = chartPoints[index + 1];
    const left = index === 0 ? chartPadding.left : (prevPoint.x + point.x) / 2;
    const right =
      index === chartPoints.length - 1
        ? chartWidth - chartPadding.right
        : (point.x + nextPoint.x) / 2;

    return {
      index,
      left,
      width: Math.max(1, right - left),
    };
  });

  const activePoint = activeIndex === null ? null : chartPoints[activeIndex];
  const tooltipWidth = 128;
  const tooltipHeight = 50;
  const tooltipX = activePoint
    ? clamp(
        activePoint.x - tooltipWidth / 2,
        chartPadding.left,
        chartWidth - chartPadding.right - tooltipWidth
      )
    : 0;
  const tooltipY = activePoint
    ? Math.max(chartPadding.top + 6, activePoint.y - tooltipHeight - 12)
    : 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-52 w-full"
        role="img"
        aria-label="Diagramme des demandes de visite sur 7 jours"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = chartPadding.top + t * innerHeight;
          return (
            <line
              key={`grid-${t}`}
              x1={chartPadding.left}
              x2={chartWidth - chartPadding.right}
              y1={y}
              y2={y}
              stroke="#dbe4ef"
              strokeDasharray={t === 1 ? "0" : "4 6"}
              strokeWidth={1}
            />
          );
        })}

        {yTicks.map((tick) => {
          const y = baselineY - (tick / chartMaxValue) * innerHeight;
          return (
            <text
              key={`tick-${tick}`}
              x={chartPadding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#94a3b8"
              fontWeight="600"
            >
              {tick}
            </text>
          );
        })}

        {hoverZones.map((zone) => (
          <rect
            key={`hover-zone-${zone.index}`}
            x={zone.left}
            y={chartPadding.top}
            width={zone.width}
            height={innerHeight}
            fill="transparent"
            tabIndex={0}
            aria-label={`${chartPoints[zone.index].label}: ${chartPoints[zone.index].total} demandes`}
            onMouseEnter={() => setActiveIndex(zone.index)}
            onFocus={() => setActiveIndex(zone.index)}
          />
        ))}

        {activePoint && (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={chartPadding.top}
            y2={baselineY}
            stroke="#94a3b8"
            strokeDasharray="3 4"
            strokeWidth={1}
          />
        )}

        {areaPath && <path d={areaPath} fill="#1a3a5c" fillOpacity={0.12} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#1a3a5c"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {chartPoints.map((point, index) => {
          const isActive = index === activeIndex;
          return (
            <g key={`point-${point.label}`}>
              <circle cx={point.x} cy={point.y} r={isActive ? 7 : 4.5} fill="#ffffff" />
              <circle cx={point.x} cy={point.y} r={isActive ? 4.5 : 3} fill="#1a3a5c" />
              <text
                x={point.x}
                y={chartHeight - 14}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
                fontWeight="600"
              >
                {point.label}
              </text>
            </g>
          );
        })}

        {activePoint && (
          <g>
            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx={12}
              fill="#0f1724"
              fillOpacity={0.95}
            />
            <text
              x={tooltipX + 10}
              y={tooltipY + 18}
              fontSize="11"
              fill="#cbd5e1"
              fontWeight="600"
            >
              {activePoint.label}
            </text>
            <text
              x={tooltipX + 10}
              y={tooltipY + 36}
              fontSize="13"
              fill="#ffffff"
              fontWeight="700"
            >
              {activePoint.total} demande{activePoint.total > 1 ? "s" : ""}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
