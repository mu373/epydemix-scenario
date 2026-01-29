import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { Scenario } from "@/types/api";

export const scenariosAtom = atomWithStorage<Scenario[]>(
  "epyscenario-scenarios",
  []
);

export const primaryScenarioIdAtom = atomWithStorage<string | null>(
  "epyscenario-primary-scenario",
  null
);

export const comparisonScenarioIdsAtom = atomWithStorage<string[]>(
  "epyscenario-comparison-scenarios",
  []
);

export const addScenarioAtom = atom(null, (get, set, scenario: Scenario) => {
  const scenarios = get(scenariosAtom);
  const currentPrimaryId = get(primaryScenarioIdAtom);
  const comparisonIds = get(comparisonScenarioIdsAtom);

  // Add the new scenario
  const newScenarios = [...scenarios, scenario];
  set(scenariosAtom, newScenarios);

  // Set as primary if no primary exists or if current primary is invalid
  const primaryExists = currentPrimaryId && scenarios.some(s => s.id === currentPrimaryId);
  if (!primaryExists) {
    set(primaryScenarioIdAtom, scenario.id);
  } else {
    // Auto-add to comparison list if not the primary
    set(comparisonScenarioIdsAtom, [...comparisonIds, scenario.id]);
  }
});

export const deleteScenarioAtom = atom(null, (get, set, scenarioId: string) => {
  const scenarios = get(scenariosAtom);
  const primaryId = get(primaryScenarioIdAtom);
  const comparisonIds = get(comparisonScenarioIdsAtom);

  set(
    scenariosAtom,
    scenarios.filter((s) => s.id !== scenarioId)
  );

  if (primaryId === scenarioId) {
    const remaining = scenarios.filter((s) => s.id !== scenarioId);
    set(primaryScenarioIdAtom, remaining.length > 0 ? remaining[0].id : null);
  }

  set(
    comparisonScenarioIdsAtom,
    comparisonIds.filter((id) => id !== scenarioId)
  );
});

export const setPrimaryScenarioAtom = atom(null, (get, set, newPrimaryId: string) => {
  const oldPrimaryId = get(primaryScenarioIdAtom);
  const comparisonIds = get(comparisonScenarioIdsAtom);

  // Set new primary
  set(primaryScenarioIdAtom, newPrimaryId);

  // Update comparison list: remove new primary, add old primary (swap)
  let newComparisonIds = comparisonIds.filter((id) => id !== newPrimaryId);
  if (oldPrimaryId && oldPrimaryId !== newPrimaryId) {
    newComparisonIds = [...newComparisonIds, oldPrimaryId];
  }
  set(comparisonScenarioIdsAtom, newComparisonIds);
});

export const primaryScenarioAtom = atom((get) => {
  const scenarios = get(scenariosAtom);
  const primaryId = get(primaryScenarioIdAtom);
  return scenarios.find((s) => s.id === primaryId) ?? null;
});

export const comparisonScenariosAtom = atom((get) => {
  const scenarios = get(scenariosAtom);
  const comparisonIds = get(comparisonScenarioIdsAtom);
  return scenarios.filter((s) => comparisonIds.includes(s.id));
});
