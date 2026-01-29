"use client";

import { useMemo } from "react";

interface HeatmapCell {
  x: number;
  y: number;
  xLabel: string;
  yLabel: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  colorScale?: "blue" | "red" | "green";
}

export function HeatmapChart({
  data,
  xLabels,
  yLabels,
  colorScale = "blue",
}: HeatmapChartProps) {
  const { minValue, maxValue } = useMemo(() => {
    const values = data.map((d) => d.value);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
    };
  }, [data]);

  const getColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue || 1);
    const intensity = Math.round(normalized * 255);

    switch (colorScale) {
      case "red":
        return `rgb(${intensity}, ${255 - intensity}, ${255 - intensity})`;
      case "green":
        return `rgb(${255 - intensity}, ${intensity}, ${255 - intensity})`;
      case "blue":
      default:
        return `rgb(${255 - intensity}, ${255 - intensity}, ${intensity + 100})`;
    }
  };

  const cellSize = Math.min(60, 300 / Math.max(xLabels.length, yLabels.length));
  const labelOffset = 80;
  const numRows = yLabels.length;

  // Reverse Y labels so 0-4 is at bottom
  const reversedYLabels = [...yLabels].reverse();

  return (
    <div className="overflow-auto">
      <svg
        width={labelOffset + xLabels.length * cellSize}
        height={labelOffset + yLabels.length * cellSize}
      >
        {/* X axis labels (at bottom) */}
        <g transform={`translate(${labelOffset}, ${labelOffset + numRows * cellSize + 15})`}>
          {xLabels.map((label, i) => (
            <text
              key={`x-${i}`}
              x={i * cellSize + cellSize / 2}
              y={0}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              {label}
            </text>
          ))}
        </g>

        {/* Y axis labels (reversed so 0-4 at bottom) */}
        <g transform={`translate(${labelOffset - 10}, ${labelOffset})`}>
          {reversedYLabels.map((label, i) => (
            <text
              key={`y-${i}`}
              x={0}
              y={i * cellSize + cellSize / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-muted-foreground"
            >
              {label}
            </text>
          ))}
        </g>

        {/* Heatmap cells (Y inverted) */}
        <g transform={`translate(${labelOffset}, ${labelOffset})`}>
          {data.map((cell, i) => {
            // Invert Y position: bottom = 0, top = numRows-1
            const invertedY = numRows - 1 - cell.y;
            return (
              <g key={i}>
                <rect
                  x={cell.x * cellSize}
                  y={invertedY * cellSize}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  fill={getColor(cell.value)}
                  rx={2}
                >
                  <title>
                    {cell.yLabel} → {cell.xLabel}: {cell.value.toFixed(2)}
                  </title>
                </rect>
                {cellSize >= 40 && (
                  <text
                    x={cell.x * cellSize + cellSize / 2 - 1}
                    y={invertedY * cellSize + cellSize / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-foreground"
                  >
                    {cell.value.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Color scale legend */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">
          {minValue.toFixed(1)}
        </span>
        <div
          className="h-4 w-32 rounded"
          style={{
            background: `linear-gradient(to right, ${getColor(minValue)}, ${getColor(maxValue)})`,
          }}
        />
        <span className="text-xs text-muted-foreground">
          {maxValue.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
