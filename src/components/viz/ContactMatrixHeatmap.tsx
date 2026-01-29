"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { primaryScenarioAtom } from "@/lib/atoms/scenarios";
import { contactMatricesQueryOptions } from "@/lib/api/queries";
import { transformContactMatrix } from "@/lib/transforms";

export function ContactMatrixHeatmap() {
  const [selectedLayer, setSelectedLayer] = useState<string>("overall");
  const primaryScenario = useAtomValue(primaryScenarioAtom);
  const populationName = primaryScenario?.response.metadata.population_name;

  const { data: contacts, isLoading } = useQuery(
    contactMatricesQueryOptions(populationName || "")
  );

  if (!primaryScenario) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Run a simulation to see contact matrices
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!contacts) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Contact matrix data not available
      </div>
    );
  }

  const layers = Object.keys(contacts.layers);
  const currentMatrix =
    selectedLayer === "overall"
      ? contacts.overall
      : contacts.layers[selectedLayer];

  const heatmapData = transformContactMatrix(currentMatrix, contacts.age_groups);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <Label>Contact Layer</Label>
          <Select value={selectedLayer} onValueChange={setSelectedLayer}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall</SelectItem>
              {layers.map((layer) => (
                <SelectItem key={layer} value={layer}>
                  {layer.charAt(0).toUpperCase() + layer.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-center">
        <HeatmapChart
          data={heatmapData}
          xLabels={contacts.age_groups}
          yLabels={contacts.age_groups}
        />
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Contact rates between age groups in the {selectedLayer} setting.
        <br />
        Values represent average number of contacts per day.
      </p>
    </div>
  );
}
