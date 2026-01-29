"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface InitialConditionsProps {
  modelPreset: string;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
}

export function InitialConditions({
  modelPreset,
  values,
  onChange,
}: InitialConditionsProps) {
  const infectedPct = values.infected_pct ?? 0.1;
  const immunePct = values.immune_pct ?? 0;

  const handleInfectedChange = (value: number) => {
    onChange({ ...values, infected_pct: value });
  };

  const handleImmuneChange = (value: number) => {
    onChange({ ...values, immune_pct: value });
  };

  // Calculate susceptible percentage
  const susceptiblePct = Math.max(0, 100 - infectedPct - immunePct);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set the initial percentage of infected and immune individuals.
        The remaining population will be susceptible.
      </p>

      {/* Infected percentage */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Initially Infected (%)</Label>
          <span className="text-sm text-muted-foreground">
            {infectedPct.toFixed(2)}%
          </span>
        </div>
        <Slider
          value={[infectedPct]}
          onValueChange={([v]) => handleInfectedChange(v)}
          min={0}
          max={10}
          step={0.01}
        />
        <p className="text-xs text-muted-foreground">
          Percentage of population initially infected (seeding the epidemic)
        </p>
      </div>

      {/* Immune percentage */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Initially Immune (%)</Label>
          <span className="text-sm text-muted-foreground">
            {immunePct.toFixed(1)}%
          </span>
        </div>
        <Slider
          value={[immunePct]}
          onValueChange={([v]) => handleImmuneChange(v)}
          min={0}
          max={99}
          step={1}
        />
        <p className="text-xs text-muted-foreground">
          Percentage of population with pre-existing immunity (e.g., from prior infection or vaccination)
        </p>
      </div>

      {/* Summary box */}
      <div className="rounded-lg bg-muted p-3 space-y-1">
        <div className="text-sm font-medium">Initial Population Distribution</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Susceptible:</span>{" "}
            <span className="font-medium">{susceptiblePct.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Infected:</span>{" "}
            <span className="font-medium">{infectedPct.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Immune:</span>{" "}
            <span className="font-medium">{immunePct.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
