"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { populationDetailQueryOptions, modelPresetsQueryOptions } from "@/lib/api/queries";
import type { VaccinationFormData, VaccinationSettings } from "@/types/api";

interface VaccinationConfigProps {
  modelPreset: string;
  populationName: string;
  startDate: string; // Simulation start date for reference
  vaccinations: VaccinationFormData[];
  settings: VaccinationSettings;
  onChange: (vaccinations: VaccinationFormData[]) => void;
  onSettingsChange: (settings: VaccinationSettings) => void;
}

const ROLLOUT_SHAPES = [
  { value: "flat", label: "Flat (constant daily rate)" },
  { value: "ramp", label: "Ramp (gradual increase)" },
] as const;

export function VaccinationConfig({
  modelPreset,
  populationName,
  startDate,
  vaccinations,
  settings,
  onChange,
  onSettingsChange,
}: VaccinationConfigProps) {
  const { data: population } = useQuery(
    populationDetailQueryOptions(populationName)
  );
  const { data: presetsData } = useQuery(modelPresetsQueryOptions);

  const preset = presetsData?.presets.find((p) => p.name === modelPreset);
  const compartments = preset?.compartments || [];
  const ageGroups = population?.age_groups.map((ag) => ag.name) || [];

  // Default end date: 100 days after simulation start
  const defaultEndDate = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + 100);
    return start.toISOString().split("T")[0];
  };

  const addVaccination = () => {
    const newVaccination: VaccinationFormData = {
      name: `Campaign ${vaccinations.length + 1}`,
      start_date: startDate,
      end_date: defaultEndDate(),
      coverage: 0.5,
      ve_sus: 0.9,
      target_age_groups: ageGroups.length > 0 ? [ageGroups[0]] : [],
      rollout: {
        shape: "flat",
      },
    };
    onChange([...vaccinations, newVaccination]);
  };

  const updateVaccination = (index: number, updates: Partial<VaccinationFormData>) => {
    const updated = vaccinations.map((vaccination, i) =>
      i === index ? { ...vaccination, ...updates } : vaccination
    );
    onChange(updated);
  };

  const removeVaccination = (index: number) => {
    onChange(vaccinations.filter((_, i) => i !== index));
  };

  const toggleAgeGroup = (index: number, ageGroup: string) => {
    const current = vaccinations[index].target_age_groups;
    const updated = current.includes(ageGroup)
      ? current.filter((ag) => ag !== ageGroup)
      : [...current, ageGroup];
    updateVaccination(index, { target_age_groups: updated });
  };

  const toggleTargetCompartment = (compartment: string) => {
    const current = settings.target_compartments;
    const updated = current.includes(compartment)
      ? current.filter((c) => c !== compartment)
      : [...current, compartment];
    // Ensure at least one compartment is selected
    if (updated.length > 0) {
      onSettingsChange({ ...settings, target_compartments: updated });
    }
  };

  const formatVaccinationSummary = (vax: VaccinationFormData): string => {
    const ages = vax.target_age_groups.join(", ") || "none";
    const cov = Math.round(vax.coverage * 100);
    const ve = Math.round(vax.ve_sus * 100);
    const rollout = vax.rollout.shape === "ramp"
      ? `ramp(${vax.rollout.ramp_up_days}d)`
      : "flat";
    // Format dates as short form
    const startShort = new Date(vax.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endShort = new Date(vax.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${vax.name} · ages: ${ages} · cov ${cov}% · VE ${ve}% · ${startShort}→${endShort} · ${rollout}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add vaccination campaigns. Vaccination is modeled as all-or-nothing
        and is applied to susceptibility.
      </p>

      {/* Global Vaccination Settings */}
      {vaccinations.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Vaccination Settings
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2 border rounded-lg p-3 mt-2">
            <Label>Eligible Compartments</Label>
            <p className="text-xs text-muted-foreground">
              Select which compartments are eligible for vaccination (applies to all campaigns).
            </p>
            <div className="flex flex-wrap gap-2">
              {compartments.map((comp) => (
                <label
                  key={comp}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={settings.target_compartments.includes(comp)}
                    onCheckedChange={() => toggleTargetCompartment(comp)}
                  />
                  <span>{comp}</span>
                </label>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {vaccinations.map((vaccination, index) => (
        <div key={index} className="rounded-lg border p-4 space-y-4 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => removeVaccination(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Campaign Name */}
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input
              value={vaccination.name}
              onChange={(e) =>
                updateVaccination(index, { name: e.target.value })
              }
            />
          </div>

          {/* Start/End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={vaccination.start_date}
                onChange={(e) =>
                  updateVaccination(index, {
                    start_date: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={vaccination.end_date}
                min={vaccination.start_date}
                onChange={(e) =>
                  updateVaccination(index, {
                    end_date: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Coverage and Efficacy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Target Coverage</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(vaccination.coverage * 100)}%
                </span>
              </div>
              <Slider
                value={[vaccination.coverage * 100]}
                onValueChange={([v]) =>
                  updateVaccination(index, { coverage: v / 100 })
                }
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Vaccine Efficacy</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(vaccination.ve_sus * 100)}%
                </span>
              </div>
              <Slider
                value={[vaccination.ve_sus * 100]}
                onValueChange={([v]) =>
                  updateVaccination(index, { ve_sus: v / 100 })
                }
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* Target Age Groups */}
          <div className="space-y-2">
            <Label>Target Age Groups</Label>
            <div className="flex flex-wrap gap-2">
              {ageGroups.map((ag) => (
                <label
                  key={ag}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={vaccination.target_age_groups.includes(ag)}
                    onCheckedChange={() => toggleAgeGroup(index, ag)}
                  />
                  <span>{ag}</span>
                </label>
              ))}
            </div>
            {ageGroups.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select a population to see age groups
              </p>
            )}
          </div>

          {/* Rollout Shape */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rollout Shape</Label>
              <Select
                value={vaccination.rollout.shape}
                onValueChange={(value: "flat" | "ramp") =>
                  updateVaccination(index, {
                    rollout: {
                      shape: value,
                      ramp_up_days: value === "ramp" ? 14 : undefined,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLLOUT_SHAPES.map((shape) => (
                    <SelectItem key={shape.value} value={shape.value}>
                      {shape.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vaccination.rollout.shape === "ramp" && (
              <div className="space-y-2">
                <Label>Ramp-up Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={vaccination.rollout.ramp_up_days || 14}
                  onChange={(e) =>
                    updateVaccination(index, {
                      rollout: {
                        ...vaccination.rollout,
                        ramp_up_days: parseInt(e.target.value) || 14,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="text-xs text-muted-foreground border-t pt-2">
            {formatVaccinationSummary(vaccination)}
          </div>
        </div>
      ))}

      <Button variant="outline" className="w-full" onClick={addVaccination}>
        <Plus className="mr-2 h-4 w-4" />
        Add Vaccination Campaign
      </Button>
    </div>
  );
}
