"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SimulationConfigProps {
  startDate: string;
  endDate: string;
  nsim: number;
  seed: number | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onNsimChange: (value: number) => void;
  onSeedChange: (value: number | null) => void;
}

export function SimulationConfig({
  startDate,
  endDate,
  nsim,
  seed,
  onStartDateChange,
  onEndDateChange,
  onNsimChange,
  onSeedChange,
}: SimulationConfigProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nsim">Simulations (Nsim)</Label>
          <Input
            id="nsim"
            type="number"
            min={1}
            max={1000}
            value={nsim}
            onChange={(e) => onNsimChange(parseInt(e.target.value) || 100)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seed">Seed (optional)</Label>
          <Input
            id="seed"
            type="number"
            placeholder="Random"
            value={seed ?? ""}
            onChange={(e) =>
              onSeedChange(e.target.value ? parseInt(e.target.value) : null)
            }
          />
        </div>
      </div>
    </div>
  );
}
