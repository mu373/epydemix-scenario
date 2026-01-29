"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { populationDetailQueryOptions } from "@/lib/api/queries";
import type { InterventionFormData } from "@/types/api";

interface InterventionBuilderProps {
  populationName: string;
  startDate: string; // Simulation start date for reference
  interventions: InterventionFormData[];
  onChange: (interventions: InterventionFormData[]) => void;
}

export function InterventionBuilder({
  populationName,
  startDate,
  interventions,
  onChange,
}: InterventionBuilderProps) {
  const { data: population } = useQuery(
    populationDetailQueryOptions(populationName)
  );

  const availableLayers = ["all", ...(population?.available_layers || [])];

  // Default end date: 30 days after start
  const defaultEndDate = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + 30);
    return start.toISOString().split("T")[0];
  };

  const addIntervention = () => {
    const newIntervention: InterventionFormData = {
      layer: availableLayers[0] || "all",
      start_date: startDate,
      end_date: defaultEndDate(),
      reduction_pct: 50,
    };
    onChange([...interventions, newIntervention]);
  };

  const updateIntervention = (
    index: number,
    updates: Partial<InterventionFormData>
  ) => {
    const updated = interventions.map((intervention, i) =>
      i === index ? { ...intervention, ...updates } : intervention
    );
    onChange(updated);
  };

  const removeIntervention = (index: number) => {
    onChange(interventions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define contact reduction interventions by layer (e.g., school closures,
        work-from-home policies).
      </p>

      {interventions.map((intervention, index) => (
        <div
          key={index}
          className="rounded-lg border p-4 space-y-4 relative"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => removeIntervention(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="space-y-2">
            <Label>Contact Layer</Label>
            <Select
              value={intervention.layer}
              onValueChange={(value) =>
                updateIntervention(index, { layer: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLayers.map((layer) => (
                  <SelectItem key={layer} value={layer}>
                    {layer === "all" ? "All layers" : layer.charAt(0).toUpperCase() + layer.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={intervention.start_date}
                onChange={(e) =>
                  updateIntervention(index, { start_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={intervention.end_date}
                min={intervention.start_date}
                onChange={(e) =>
                  updateIntervention(index, { end_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Contact Reduction</Label>
              <span className="text-sm text-muted-foreground">
                {intervention.reduction_pct}%
              </span>
            </div>
            <Slider
              value={[intervention.reduction_pct]}
              onValueChange={([v]) =>
                updateIntervention(index, { reduction_pct: v })
              }
              max={100}
              step={5}
            />
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={addIntervention}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Intervention
      </Button>
    </div>
  );
}
