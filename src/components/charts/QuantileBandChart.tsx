"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { formatNumber } from "@/lib/transforms";
import { COMPARTMENT_COLORS } from "@/lib/colors";

export interface QuantileBandDataPoint {
  date: string;
  median: number;
  q025: number;
  q975: number;
  q25: number;
  q75: number;
}

interface QuantileBandChartProps {
  data: QuantileBandDataPoint[];
  color?: string;
  label?: string;
}

export function QuantileBandChart({
  data,
  color = COMPARTMENT_COLORS[0],
  label = "Value",
}: QuantileBandChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  const formatXAxis = (value: string) => {
    try {
      return format(new Date(value), "MMM d");
    } catch {
      return value;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxis}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          tickFormatter={formatNumber}
          tick={{ fontSize: 12 }}
          width={70}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <Tooltip
          content={({ active, payload, label: tooltipLabel }) => {
            if (active && payload && payload.length && tooltipLabel) {
              const point = payload[0]?.payload as QuantileBandDataPoint;
              return (
                <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-medium">{format(new Date(String(tooltipLabel)), "MMM d, yyyy")}</p>
                  <div className="mt-2 space-y-1">
                    <p style={{ color }}>Median: {formatNumber(point.median)}</p>
                    <p className="text-gray-500">
                      95% CI: {formatNumber(point.q025)} - {formatNumber(point.q975)}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="median"
          stroke={color}
          strokeWidth={2}
          dot={false}
          name={label}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface MultiLineDataset {
  data: QuantileBandDataPoint[];
  color: string;
  label: string;
  id?: string; // unique identifier for React keys (falls back to label if not provided)
}

interface MultiLineChartProps {
  datasets: MultiLineDataset[];
}

export function MultiLineChart({ datasets }: MultiLineChartProps) {
  if (!datasets || datasets.length === 0 || datasets.every(d => d.data.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  // Merge all datasets by date
  const mergedData: Record<string, Record<string, string | number>> = {};

  datasets.forEach(({ data, label }) => {
    data.forEach((point) => {
      if (!mergedData[point.date]) {
        mergedData[point.date] = { date: point.date };
      }
      mergedData[point.date][label] = point.median;
      mergedData[point.date][`${label}_q025`] = point.q025;
      mergedData[point.date][`${label}_q975`] = point.q975;
    });
  });

  const chartData = Object.values(mergedData).sort(
    (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
  );

  // Calculate Y-axis domain across all datasets
  let yMin = Infinity;
  let yMax = -Infinity;
  datasets.forEach(({ data }) => {
    data.forEach((point) => {
      if (point.median < yMin) yMin = point.median;
      if (point.median > yMax) yMax = point.median;
      if (point.q975 > yMax) yMax = point.q975;
      if (point.q025 < yMin) yMin = point.q025;
    });
  });
  // Add 10% padding to the domain
  const yPadding = (yMax - yMin) * 0.1;
  const yDomain: [number, number] = [Math.max(0, yMin - yPadding), yMax + yPadding];

  const formatXAxis = (value: string) => {
    try {
      return format(new Date(value), "MMM d");
    } catch {
      return value;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxis}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          tickFormatter={formatNumber}
          tick={{ fontSize: 12 }}
          width={70}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          domain={yDomain}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length && label) {
              return (
                <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-medium">
                    {format(new Date(String(label)), "MMM d, yyyy")}
                  </p>
                  <div className="mt-2 space-y-1">
                    {datasets.map(({ label: datasetLabel, color, id }) => {
                      const point = payload.find((p) => p.dataKey === datasetLabel);
                      if (point) {
                        return (
                          <div key={id || datasetLabel} className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span>{datasetLabel}: {formatNumber(point.value as number)}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />

        {datasets.map(({ label, color, id }) => (
          <Line
            key={id || label}
            type="monotone"
            dataKey={label}
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={label}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export { COMPARTMENT_COLORS };
