"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { modelPresetsQueryOptions } from "@/lib/api/queries";
import {
  workspaceAtom,
  setWorkspaceModelAtom,
} from "@/lib/atoms/workspace";
import { Skeleton } from "@/components/ui/skeleton";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string, parameters: Record<string, number>) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { data, isLoading, error } = useQuery(modelPresetsQueryOptions);
  const workspace = useAtomValue(workspaceAtom);
  const setWorkspaceModel = useSetAtom(setWorkspaceModelAtom);

  const handleChange = (presetName: string) => {
    const preset = data?.presets.find((p) => p.name === presetName);
    if (preset) {
      setWorkspaceModel(presetName);
      onChange(presetName, preset.parameters);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Model</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Model</Label>
        <div className="text-sm text-destructive">
          Failed to load models: {error.message}
        </div>
      </div>
    );
  }

  const selectedPreset = data?.presets.find((p) => p.name === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="model">Model</Label>
      <Select
        value={value}
        onValueChange={handleChange}
        disabled={workspace.isLocked}
      >
        <SelectTrigger id="model" className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent position="popper">
          {data?.presets.map((preset) => (
            <SelectItem key={preset.name} value={preset.name}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedPreset && (
        <p className="text-sm text-muted-foreground">
          {selectedPreset.description}
        </p>
      )}
    </div>
  );
}
