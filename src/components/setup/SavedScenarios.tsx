"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  scenariosAtom,
  primaryScenarioIdAtom,
  setPrimaryScenarioAtom,
  deleteScenarioAtom,
} from "@/lib/atoms/scenarios";
import { formatDistanceToNow } from "date-fns";

export function SavedScenarios() {
  const scenarios = useAtomValue(scenariosAtom);
  const primaryId = useAtomValue(primaryScenarioIdAtom);
  const deleteScenario = useSetAtom(deleteScenarioAtom);
  const setPrimary = useSetAtom(setPrimaryScenarioAtom);

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No scenarios saved yet.</p>
        <p className="text-sm mt-1">Run a simulation to create your first scenario.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              primaryId === scenario.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{scenario.name}</span>
                {primaryId === scenario.id && (
                  <Badge variant="secondary" className="text-xs">
                    Primary
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{scenario.response.metadata.model_preset}</span>
                <span>•</span>
                <span>{scenario.response.metadata.population_name.replace(/_/g, " ")}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(scenario.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPrimary(scenario.id)}
                title="View as primary"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteScenario(scenario.id)}
                title="Delete scenario"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
