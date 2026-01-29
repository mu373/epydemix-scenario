import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { Workspace } from "@/types/api";

const defaultWorkspace: Workspace = {
  modelPreset: null,
  populationName: null,
  isLocked: false,
};

export const workspaceAtom = atomWithStorage<Workspace>(
  "epyscenario-workspace",
  defaultWorkspace
);

export const lockWorkspaceAtom = atom(
  (get) => get(workspaceAtom).isLocked,
  (get, set, locked: boolean) => {
    const current = get(workspaceAtom);
    set(workspaceAtom, { ...current, isLocked: locked });
  }
);

export const setWorkspaceModelAtom = atom(
  null,
  (get, set, modelPreset: string) => {
    const current = get(workspaceAtom);
    if (!current.isLocked) {
      set(workspaceAtom, { ...current, modelPreset });
    }
  }
);

export const setWorkspacePopulationAtom = atom(
  null,
  (get, set, populationName: string) => {
    const current = get(workspaceAtom);
    if (!current.isLocked) {
      set(workspaceAtom, { ...current, populationName });
    }
  }
);

export const resetWorkspaceAtom = atom(null, (_get, set) => {
  set(workspaceAtom, defaultWorkspace);
});
