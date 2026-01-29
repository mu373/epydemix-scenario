"use client";

import { useState, useMemo, useEffect } from "react";
import { useAtomValue } from "jotai";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ErrorBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  primaryScenarioAtom,
  comparisonScenariosAtom,
} from "@/lib/atoms/scenarios";
import { transformSummaryMetrics, formatNumber, SummaryMetric } from "@/lib/transforms";
import { SCENARIO_COLORS } from "@/lib/colors";
import { format } from "date-fns";

type MetricType = "compartment" | "transition";

export function SummaryMetrics() {
  const primaryScenario = useAtomValue(primaryScenarioAtom);
  const comparisonScenarios = useAtomValue(comparisonScenariosAtom);

  // Selection state
  const [metricType, setMetricType] = useState<MetricType>("compartment");
  const [selectedKey, setSelectedKey] = useState<string>("");

  // Get available options from primary scenario
  const { compartmentKeys, transitionKeys } = useMemo(() => {
    if (!primaryScenario) return { compartmentKeys: [], transitionKeys: [] };

    const metrics = transformSummaryMetrics(primaryScenario.response);
    const compartments = metrics
      .filter((m) => m.label.startsWith("Peak"))
      .map((m) => m.label.replace("Peak ", ""));
    const transitions = metrics
      .filter((m) => m.label.startsWith("Total"))
      .map((m) => m.label.replace("Total ", ""));

    return { compartmentKeys: compartments, transitionKeys: transitions };
  }, [primaryScenario]);

  const availableKeys = metricType === "compartment" ? compartmentKeys : transitionKeys;

  // Set default key when type or options change
  useEffect(() => {
    if (availableKeys.length > 0 && !availableKeys.includes(selectedKey)) {
      if (metricType === "compartment" && availableKeys.includes("Infected")) {
        setSelectedKey("Infected");
      } else {
        setSelectedKey(availableKeys[0]);
      }
    }
  }, [availableKeys, selectedKey, metricType]);

  if (!primaryScenario) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Run a simulation to see summary metrics
      </div>
    );
  }

  const allScenarios = [primaryScenario, ...comparisonScenarios];

  // Helper to get metric for a scenario
  const getMetric = (scenarioResponse: typeof primaryScenario.response, label: string): SummaryMetric | undefined => {
    const metrics = transformSummaryMetrics(scenarioResponse);
    return metrics.find((m) => m.label === label);
  };

  // Labels based on type
  const peakLabel = `Peak ${selectedKey}`;
  const totalLabel = `Total ${selectedKey}`;

  // Build data for peak
  const peakData = allScenarios.map((scenario, i) => {
    const metric = getMetric(scenario.response, peakLabel);
    return {
      name: scenario.name,
      color: SCENARIO_COLORS[i % SCENARIO_COLORS.length],
      value: metric?.median || 0,
      lowerError: metric ? metric.median - metric.ci95[0] : 0,
      upperError: metric ? metric.ci95[1] - metric.median : 0,
      peakDate: metric?.peakDate,
      ci95: metric?.ci95,
    };
  });

  // Build data for total
  const totalData = allScenarios.map((scenario, i) => {
    const metric = getMetric(scenario.response, totalLabel);
    return {
      name: scenario.name,
      color: SCENARIO_COLORS[i % SCENARIO_COLORS.length],
      value: metric?.median || 0,
      lowerError: metric ? metric.median - metric.ci95[0] : 0,
      upperError: metric ? metric.ci95[1] - metric.median : 0,
      ci95: metric?.ci95,
    };
  });

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Type</Label>
          <Select value={metricType} onValueChange={(v) => setMetricType(v as MetricType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compartment">Compartment</SelectItem>
              <SelectItem value="transition">Transition</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Key</Label>
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {availableKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Peak Section - only for compartments */}
      {selectedKey && metricType === "compartment" && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">{peakLabel}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {peakData.map((data, i) => (
              <Card
                key={allScenarios[i].id}
                className="border-l-4"
                style={{ borderLeftColor: data.color }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{data.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatNumber(data.value)}</p>
                  {data.ci95 && (
                    <p className="text-xs text-muted-foreground">
                      95% CI: {formatNumber(data.ci95[0])} - {formatNumber(data.ci95[1])}
                    </p>
                  )}
                  {data.peakDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Peak: {format(new Date(data.peakDate), "MMM d, yyyy")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">{peakLabel}: {formatNumber(data.value)}</p>
                          <p className="text-xs text-muted-foreground">
                            95% CI: {formatNumber(data.value - data.lowerError)} - {formatNumber(data.value + data.upperError)}
                          </p>
                          {data.peakDate && (
                            <p className="text-xs text-muted-foreground">
                              Peak: {format(new Date(data.peakDate), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" name={peakLabel} isAnimationActive={false}>
                  {peakData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <ErrorBar dataKey="upperError" width={4} strokeWidth={2} direction="y" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Total Section - only for transitions */}
      {selectedKey && metricType === "transition" && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">{totalLabel}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {totalData.map((data, i) => (
              <Card
                key={allScenarios[i].id}
                className="border-l-4"
                style={{ borderLeftColor: data.color }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{data.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatNumber(data.value)}</p>
                  {data.ci95 && (
                    <p className="text-xs text-muted-foreground">
                      95% CI: {formatNumber(data.ci95[0])} - {formatNumber(data.ci95[1])}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">{totalLabel}: {formatNumber(data.value)}</p>
                          <p className="text-xs text-muted-foreground">
                            95% CI: {formatNumber(data.value - data.lowerError)} - {formatNumber(data.value + data.upperError)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" name={totalLabel} isAnimationActive={false}>
                  {totalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <ErrorBar dataKey="upperError" width={4} strokeWidth={2} direction="y" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
