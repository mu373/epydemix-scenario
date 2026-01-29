"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useAtomValue } from "jotai";
import { Download, X } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiLineChart } from "@/components/charts/QuantileBandChart";
import { COMPARTMENT_COLORS } from "@/lib/colors";
import {
  primaryScenarioAtom,
  comparisonScenariosAtom,
} from "@/lib/atoms/scenarios";
import { transformTrajectoryData, transformTransitionData, generateCSV } from "@/lib/transforms";

type DataType = "compartment" | "transition";

// Format key for display (replace underscores with spaces or arrows)
function formatKey(key: string, type: DataType): string {
  if (type === "transition") {
    return key.replace(/_to_/g, " → ").replace(/_/g, " ");
  }
  return key.replace(/_/g, " ");
}

export function TrajectoryChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dataType, setDataType] = useState<DataType>("compartment");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState<string>("total");

  const primaryScenario = useAtomValue(primaryScenarioAtom);
  const comparisonScenarios = useAtomValue(comparisonScenariosAtom);

  // Get available compartments and transitions
  const compartments = primaryScenario?.response?.metadata?.compartments || [];
  const transitions = useMemo(() => {
    const transitionData = primaryScenario?.response?.results?.transitions?.data;
    return transitionData ? Object.keys(transitionData) : [];
  }, [primaryScenario]);

  // Current available keys based on type
  const availableKeys = dataType === "compartment" ? compartments : transitions;

  // Get age groups from compartment data
  const ageGroups = useMemo(() => {
    const firstCompartment = compartments[0];
    if (!firstCompartment) return ["total"];
    const compartmentData = primaryScenario?.response?.results?.compartments?.data?.[firstCompartment];
    const groups = compartmentData ? Object.keys(compartmentData) : [];
    return groups.length > 0 ? groups : ["total"];
  }, [primaryScenario, compartments]);

  const primaryId = primaryScenario?.id;

  // Reset selections when primary scenario changes
  useEffect(() => {
    setAgeGroup("total");
    setSelectedKeys([]);
  }, [primaryId]);

  // Set default key when type or options change
  useEffect(() => {
    if (availableKeys.length > 0 && selectedKeys.length === 0) {
      if (dataType === "compartment" && availableKeys.includes("Infected")) {
        setSelectedKeys(["Infected"]);
      } else {
        setSelectedKeys([availableKeys[0]]);
      }
    }
    // Clear invalid selections when type changes
    if (selectedKeys.length > 0 && !selectedKeys.some(k => availableKeys.includes(k))) {
      setSelectedKeys([]);
    }
  }, [availableKeys, selectedKeys.length, dataType]);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        // Don't allow removing the last key
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const chartData = useMemo(() => {
    if (!primaryScenario || selectedKeys.length === 0) return [];

    const allScenarios = [primaryScenario, ...comparisonScenarios];

    // Create datasets for each combination of scenario and key
    const datasets: { data: ReturnType<typeof transformTrajectoryData>; color: string; label: string; id: string }[] = [];

    if (comparisonScenarios.length === 0) {
      // Single scenario - show keys with different colors
      selectedKeys.forEach((key, i) => {
        const data = dataType === "compartment"
          ? transformTrajectoryData(primaryScenario.response, key, ageGroup)
          : transformTransitionData(primaryScenario.response, key, ageGroup);

        datasets.push({
          data,
          color: COMPARTMENT_COLORS[i % COMPARTMENT_COLORS.length],
          label: formatKey(key, dataType),
          id: `${primaryScenario.id}-${key}`,
        });
      });
    } else {
      // Multiple scenarios - show scenario + key combinations
      allScenarios.forEach((scenario, si) => {
        selectedKeys.forEach((key, ki) => {
          const colorIndex = (si * selectedKeys.length + ki) % COMPARTMENT_COLORS.length;
          const data = dataType === "compartment"
            ? transformTrajectoryData(scenario.response, key, ageGroup)
            : transformTransitionData(scenario.response, key, ageGroup);

          datasets.push({
            data,
            color: COMPARTMENT_COLORS[colorIndex],
            label: `${scenario.name} - ${formatKey(key, dataType)}`,
            id: `${scenario.id}-${key}`,
          });
        });
      });
    }

    return datasets;
  }, [primaryScenario, comparisonScenarios, selectedKeys, ageGroup, dataType]);

  const handleDownloadCSV = () => {
    if (!primaryScenario || selectedKeys.length === 0) return;

    const allScenarios = [primaryScenario, ...comparisonScenarios];
    const csv = generateCSV(allScenarios, selectedKeys[0], ageGroup);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trajectories_${selectedKeys.join("-")}_${ageGroup}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("CSV downloaded");
  };

  const handleDownloadPNG = async () => {
    if (!chartRef.current) return;

    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#fff",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `trajectories_${selectedKeys.join("-")}_${ageGroup}.png`;
      a.click();
      toast.success("PNG downloaded");
    } catch {
      toast.error("Failed to download PNG");
    }
  };

  if (!primaryScenario) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Run a simulation to see trajectory data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Type</Label>
          <Select value={dataType} onValueChange={(v) => {
            setDataType(v as DataType);
            setSelectedKeys([]);
          }}>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                {selectedKeys.length === 0
                  ? "Select..."
                  : `${selectedKeys.length} selected`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-2" align="start">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableKeys.map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={selectedKeys.includes(key)}
                      onCheckedChange={() => toggleKey(key)}
                    />
                    <label
                      htmlFor={key}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {formatKey(key, dataType)}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected keys badges */}
        <div className="flex flex-wrap gap-1">
          {selectedKeys.map((key, i) => (
            <Badge
              key={key}
              variant="secondary"
              className="gap-1"
              style={{ borderLeft: `3px solid ${COMPARTMENT_COLORS[i % COMPARTMENT_COLORS.length]}` }}
            >
              {formatKey(key, dataType)}
              {selectedKeys.length > 1 && (
                <button
                  onClick={() => toggleKey(key)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Age Group</Label>
          <Select value={ageGroup} onValueChange={setAgeGroup}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ageGroups.map((ag) => (
                <SelectItem key={ag} value={ag}>
                  {ag === "total" ? "Total (all ages)" : ag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
            <Download className="mr-2 h-4 w-4" />
            PNG
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="h-[400px] p-4 bg-background rounded-lg border">
        <MultiLineChart datasets={chartData} />
      </div>
    </div>
  );
}
