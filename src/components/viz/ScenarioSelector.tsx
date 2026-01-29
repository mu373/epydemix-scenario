"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  scenariosAtom,
  primaryScenarioIdAtom,
  comparisonScenarioIdsAtom,
  setPrimaryScenarioAtom,
} from "@/lib/atoms/scenarios";

export function ScenarioSelector() {
  const scenarios = useAtomValue(scenariosAtom);
  const primaryId = useAtomValue(primaryScenarioIdAtom);
  const comparisonIds = useAtomValue(comparisonScenarioIdsAtom);
  const setPrimary = useSetAtom(setPrimaryScenarioAtom);
  const setComparisonIds = useSetAtom(comparisonScenarioIdsAtom);

  const toggleComparison = (id: string) => {
    if (comparisonIds.includes(id)) {
      setComparisonIds(comparisonIds.filter((cid) => cid !== id));
    } else {
      setComparisonIds([...comparisonIds, id]);
    }
  };

  const removeComparison = (id: string) => {
    setComparisonIds(comparisonIds.filter((cid) => cid !== id));
  };

  if (scenarios.length === 0) {
    return null;
  }

  const otherScenarios = scenarios.filter((s) => s.id !== primaryId);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Primary:</span>
        <Select value={primaryId || ""} onValueChange={setPrimary}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select scenario" />
          </SelectTrigger>
          <SelectContent>
            {scenarios.map((scenario) => (
              <SelectItem key={scenario.id} value={scenario.id}>
                {scenario.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {otherScenarios.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Compare:</span>
          <Select value="" onValueChange={toggleComparison}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Add comparison..." />
            </SelectTrigger>
            <SelectContent>
              {otherScenarios.map((scenario) => (
                <SelectItem
                  key={scenario.id}
                  value={scenario.id}
                  disabled={comparisonIds.includes(scenario.id)}
                >
                  {scenario.name}
                  {comparisonIds.includes(scenario.id) && " (selected)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {comparisonIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {comparisonIds.map((id) => {
            const scenario = scenarios.find((s) => s.id === id);
            if (!scenario) return null;
            return (
              <Badge key={id} variant="secondary" className="gap-1">
                {scenario.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeComparison(id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
