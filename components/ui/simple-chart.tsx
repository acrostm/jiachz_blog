"use client";

import * as React from "react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  rate: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  showDots?: boolean;
  baseCurrency?: string;
  targetCurrency?: string;
  showHoverInParent?: boolean;
}

export function SimpleLineChart({
  data,
  className,
  strokeColor = "#10b981",
  strokeWidth = 2,
  baseCurrency = "CAD",
  targetCurrency = "USD",
  showHoverInParent = false,
}: SimpleLineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    rate: number;
    date: string;
    x: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 300;
  const padding = 50;

  // Calculate min and max values
  const rates = data.map((d) => d.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const range = maxRate - minRate || 1;

  // Generate SVG path and points
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const y =
      height -
      padding -
      ((point.rate - minRate) / range) * (height - 2 * padding);
    return { x, y, rate: point.rate, date: point.date, index };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const scaleX = width / rect.width;

    const actualX = mouseX * scaleX;

    // Find closest point
    let closestPoint = points[0]!;
    let minDistance = Math.abs(actualX - closestPoint.x);

    points.forEach((point) => {
      const distance = Math.abs(actualX - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (minDistance < 30) {
      // 30px threshold
      setHoveredPoint({
        rate: closestPoint.rate,
        date: closestPoint.date,
        x: closestPoint.x,
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDateLabels = () => {
    const labels = [];
    const step = Math.ceil(data.length / 5); // Show about 5 date labels
    for (let i = 0; i < data.length; i += step) {
      const point = data[i]!;
      const chartPoint = points[i]!;
      labels.push({
        date: point.date,
        x: chartPoint.x,
      });
    }
    // Always include the last point
    const lastDataPoint = data[data.length - 1]!;
    const lastChartPoint = points[points.length - 1]!;
    if (labels[labels.length - 1]?.date !== lastDataPoint.date) {
      labels.push({
        date: lastDataPoint.date,
        x: lastChartPoint.x,
      });
    }
    return labels;
  };

  return (
    <>
      {/* Hover rate display in parent container */}
      {hoveredPoint && showHoverInParent && (
        <div className="future-glass-strong absolute right-6 top-6 z-20 rounded-lg px-4 py-3 shadow-lg">
          <div className="font-mono text-sm text-muted-foreground">
            {formatDate(hoveredPoint.date)}
          </div>
          <div className="text-xl font-bold text-green-600">
            1 {baseCurrency} = {hoveredPoint.rate.toFixed(4)} {targetCurrency}
          </div>
        </div>
      )}

      <div className={cn("w-full relative", className)}>
        {/* Hover rate display */}
        {hoveredPoint && !showHoverInParent && (
          <div className="future-glass-strong absolute right-2 top-2 z-10 rounded-lg px-4 py-3 shadow-lg">
            <div className="font-mono text-sm text-muted-foreground">
              {formatDate(hoveredPoint.date)}
            </div>
            <div className="text-xl font-bold text-green-600">
              1 {baseCurrency} = {hoveredPoint.rate.toFixed(4)} {targetCurrency}
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const rate = minRate + (maxRate - minRate) * ratio;
            const y = height - padding - ratio * (height - 2 * padding);
            return (
              <g key={ratio}>
                <line
                  x1={padding - 5}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity="0.2"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-xs"
                >
                  {rate.toFixed(4)}
                </text>
              </g>
            );
          })}

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              fill={strokeColor}
              className="opacity-60"
            />
          ))}

          {/* Hover line */}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={padding}
                x2={hoveredPoint.x}
                y2={height - padding}
                stroke={strokeColor}
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <circle
                cx={hoveredPoint.x}
                cy={
                  height -
                  padding -
                  ((hoveredPoint.rate - minRate) / range) *
                    (height - 2 * padding)
                }
                r="6"
                fill={strokeColor}
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
            </>
          )}

          {/* End point */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1]!.x}
              cy={points[points.length - 1]!.y}
              r="4"
              fill={strokeColor}
              className="drop-shadow-lg"
            />
          )}

          {/* X-axis date labels */}
          {getDateLabels().map((label, index) => (
            <text
              key={index}
              x={label.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {formatDate(label.date)}
            </text>
          ))}
        </svg>
      </div>
    </>
  );
}
