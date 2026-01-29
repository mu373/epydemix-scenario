"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { toast } from "sonner";
import { Play, Loader2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ModelSelector } from "./ModelSelector";
import { PopulationSelector } from "./PopulationSelector";
import { SimulationConfig } from "./SimulationConfig";
import { InitialConditions } from "./InitialConditions";
import { ModelParameters, getDefaultParameters, convertToApiParameters, DISEASE_PRESETS } from "./ModelParameters";
import { InterventionBuilder } from "./InterventionBuilder";
import { VaccinationConfig } from "./VaccinationConfig";
import { SavedScenarios } from "./SavedScenarios";
import { useRunSimulation } from "@/lib/api/mutations";
import { contactMatricesQueryOptions, modelPresetsQueryOptions } from "@/lib/api/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  workspaceAtom,
  lockWorkspaceAtom,
  resetWorkspaceAtom,
} from "@/lib/atoms/workspace";
import { addScenarioAtom, scenariosAtom } from "@/lib/atoms/scenarios";
import type {
  SimulationRequest,
  SimulationFormState,
  Intervention,
  InterventionFormData,
  Vaccination,
  VaccinationFormData,
} from "@/types/api";

// Convert form data to API format
function convertInterventionsToApi(
  interventions: InterventionFormData[]
): Intervention[] {
  return interventions.map((intervention, i) => ({
    layer_name: intervention.layer,
    start_date: intervention.start_date,
    end_date: intervention.end_date,
    // Convert percentage (0-100) to factor (0-1)
    // reduction_pct=50 means "reduce by 50%" so factor = 1 - 0.5 = 0.5
    reduction_factor: 1 - intervention.reduction_pct / 100,
    name: `Intervention ${i + 1}`,
  }));
}

// Convert date-based vaccination form data to day-offset API format
function convertVaccinationsToApi(
  vaccinations: VaccinationFormData[],
  simulationStartDate: string
): Vaccination[] {
  const startDate = new Date(simulationStartDate);
  return vaccinations.map((vax) => ({
    name: vax.name,
    start_day: Math.round(
      (new Date(vax.start_date).getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    end_day: Math.round(
      (new Date(vax.end_date).getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    coverage: vax.coverage,
    ve_sus: vax.ve_sus,
    target_age_groups: vax.target_age_groups,
    rollout: vax.rollout,
  }));
}

const defaultFormState: SimulationFormState = {
  modelPreset: "SEIR",
  populationName: "United_States",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 250 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  nsim: 20,
  seed: null,
  initialConditions: { infected_pct: 0.1, immune_pct: 25.0 },
  parameters: getDefaultParameters("SEIR"),
  interventions: [],
  vaccinations: [],
  vaccinationSettings: { target_compartments: ["Susceptible"] },
  peakCompartments: [],
  totalTransitions: [],
};

export function SetupPanel() {
  const [formState, setFormState] =
    useState<SimulationFormState>(defaultFormState);
  const [scenarioName, setScenarioName] = useState("");

  const workspace = useAtomValue(workspaceAtom);
  const scenarios = useAtomValue(scenariosAtom);
  const setLock = useSetAtom(lockWorkspaceAtom);
  const resetWorkspace = useSetAtom(resetWorkspaceAtom);
  const addScenario = useSetAtom(addScenarioAtom);

  const mutation = useRunSimulation();

  // Fetch contact matrix for selected population (needed for R0 -> transmission_rate conversion)
  const { data: contactData } = useQuery({
    ...contactMatricesQueryOptions(formState.populationName),
    enabled: !!formState.populationName,
  });

  // Fetch model presets (for compartments and transitions)
  const { data: modelPresetsData } = useQuery(modelPresetsQueryOptions);

  // Get current model's compartments and transitions
  const currentModelPreset = modelPresetsData?.presets.find(
    (p) => p.name === formState.modelPreset
  );

  // Fallback compartments/transitions if model presets haven't loaded
  const fallbackCompartments: Record<string, string[]> = {
    SEIR: ["Susceptible", "Exposed", "Infected", "Recovered"],
    SIR: ["Susceptible", "Infected", "Recovered"],
    SIS: ["Susceptible", "Infected"],
  };
  const fallbackTransitions: Record<string, string[]> = {
    SEIR: ["Susceptible_to_Exposed", "Exposed_to_Infected", "Infected_to_Recovered"],
    SIR: ["Susceptible_to_Infected", "Infected_to_Recovered"],
    SIS: ["Susceptible_to_Infected", "Infected_to_Susceptible"],
  };

  const availableCompartments = currentModelPreset?.compartments ||
    fallbackCompartments[formState.modelPreset] || ["Infected"];
  const availableTransitions = currentModelPreset?.transitions.map(
    (t) => `${t.source}_to_${t.target}`
  ) || fallbackTransitions[formState.modelPreset] || [];

  const updateForm = (updates: Partial<SimulationFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const handleModelChange = (
    modelName: string,
    _apiParameters: Record<string, number>
  ) => {
    // Use our local parameter defaults
    const parameters = getDefaultParameters(modelName);

    updateForm({
      modelPreset: modelName,
      parameters,
    });
  };

  const handlePresetChange = (presetName: string) => {
    const preset = DISEASE_PRESETS[presetName];
    console.log("Preset selected:", presetName, "Data:", preset);
    if (!preset) return;

    updateForm({
      modelPreset: preset.model,
      parameters: { ...preset.parameters },
      initialConditions: { ...preset.initialConditions },
    });
  };

  const handleRunSimulation = async () => {
    if (!formState.modelPreset || !formState.populationName) {
      toast.error("Please select a model and population");
      return;
    }

    const name =
      scenarioName.trim() || `Scenario ${scenarios.length + 1}`;

    // Convert epidemiological parameters (R0, periods) to API format (rates)
    // Uses spectral radius from API to convert R0 to transmission_rate
    const apiParameters = convertToApiParameters(
      formState.modelPreset,
      formState.parameters,
      contactData?.spectral_radius?.overall
    );

    // Convert initial conditions to API format
    // API expects raw percentages (0-100), not fractions
    // For models with Exposed compartment (SEIR), split infected between E and I (50/50)
    const initialPercentages: Record<string, number> = {};
    const hasExposed = ["SEIR"].includes(formState.modelPreset);

    if (formState.initialConditions.infected_pct) {
      if (hasExposed) {
        // Split infected_pct 50/50 between Exposed and Infected (like epydemix-dashboard)
        initialPercentages["Exposed"] = formState.initialConditions.infected_pct / 2;
        initialPercentages["Infected"] = formState.initialConditions.infected_pct / 2;
      } else {
        initialPercentages["Infected"] = formState.initialConditions.infected_pct;
      }
    }
    if (formState.initialConditions.immune_pct) {
      initialPercentages["Recovered"] = formState.initialConditions.immune_pct;
    }

    // Debug: log what we're sending
    console.log("=== API Request Debug ===");
    console.log("Model preset:", formState.modelPreset);
    console.log("Form initial conditions:", formState.initialConditions);
    console.log("Contact data keys:", contactData ? Object.keys(contactData) : "no data");
    console.log("Contact data spectral_radius:", contactData?.spectral_radius);
    console.log("API parameters:", apiParameters);
    console.log("Initial percentages:", initialPercentages);

    const request: SimulationRequest = {
      model: {
        preset: formState.modelPreset,
        parameters: apiParameters,
      },
      population: {
        name: formState.populationName,
      },
      simulation: {
        start_date: formState.startDate,
        end_date: formState.endDate,
        Nsim: formState.nsim,
        seed: formState.seed,
      },
      initial_conditions: {
        method: "percentage",
        initial_percentages: initialPercentages,
      },
      interventions:
        formState.interventions.length > 0
          ? convertInterventionsToApi(formState.interventions)
          : undefined,
      // Vaccinations not yet supported by API
      // vaccinations: ...,
      // vaccination_settings: ...,
      output: {
        summary: {
          // Request all compartments and transitions - filtering happens in the UI
          peak_compartments: availableCompartments.length > 0 ? availableCompartments : undefined,
          total_transitions: availableTransitions.length > 0 ? availableTransitions : undefined,
        },
      },
    };

    try {
      console.log("=== Sending request ===", JSON.stringify(request, null, 2));
      const response = await mutation.mutateAsync(request);
      console.log("=== Response received ===", JSON.stringify(response, null, 2));

      if (response.status === "error") {
        toast.error(`Simulation failed: ${response.error}`);
        return;
      }

      const scenario = {
        id: response.simulation_id,
        name,
        createdAt: new Date().toISOString(),
        request,
        response,
      };

      console.log("=== Adding scenario ===", scenario.id, scenario.name);
      addScenario(scenario);
      setLock(true);
      setScenarioName("");
      toast.success(`Scenario "${name}" created successfully`);
    } catch (error) {
      toast.error(
        `Failed to run simulation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleResetWorkspace = () => {
    resetWorkspace();
    setFormState(defaultFormState);
    toast.info("Workspace reset. You can now change model and population.");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-4">
          <ModelSelector
            value={formState.modelPreset}
            onChange={handleModelChange}
          />

          <div className="space-y-2">
            <Label>Disease Preset</Label>
            <Select onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Load preset parameters..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DISEASE_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.label} ({preset.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Load predefined parameters for common diseases
            </p>
          </div>

          <PopulationSelector
            value={formState.populationName}
            onChange={(value) => updateForm({ populationName: value })}
          />
        </div>

        <Separator />

        <SimulationConfig
          startDate={formState.startDate}
          endDate={formState.endDate}
          nsim={formState.nsim}
          seed={formState.seed}
          onStartDateChange={(value) => updateForm({ startDate: value })}
          onEndDateChange={(value) => updateForm({ endDate: value })}
          onNsimChange={(value) => updateForm({ nsim: value })}
          onSeedChange={(value) => updateForm({ seed: value })}
        />

        <div className="space-y-2">
          <Label htmlFor="scenario-name">Scenario Name</Label>
          <Input
            id="scenario-name"
            placeholder={`Scenario ${scenarios.length + 1}`}
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleRunSimulation}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Simulation
            </>
          )}
        </Button>

        {workspace.isLocked && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResetWorkspace}
          >
            <Unlock className="mr-2 h-4 w-4" />
            Reset Workspace
          </Button>
        )}

        <Separator />

        <Accordion type="multiple" className="w-full" defaultValue={["initial-conditions", "parameters"]}>
          <AccordionItem value="initial-conditions">
            <AccordionTrigger>Initial Conditions</AccordionTrigger>
            <AccordionContent>
              <InitialConditions
                modelPreset={formState.modelPreset}
                values={formState.initialConditions}
                onChange={(values) =>
                  updateForm({ initialConditions: values })
                }
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="parameters">
            <AccordionTrigger>Model Parameters</AccordionTrigger>
            <AccordionContent>
              <ModelParameters
                modelPreset={formState.modelPreset}
                parameters={formState.parameters}
                onChange={(parameters) => updateForm({ parameters })}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="interventions">
            <AccordionTrigger>
              Interventions
              {formState.interventions.length > 0 && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {formState.interventions.length}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <InterventionBuilder
                populationName={formState.populationName}
                startDate={formState.startDate}
                interventions={formState.interventions}
                onChange={(interventions) => updateForm({ interventions })}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Vaccinations - hidden until API supports it */}
          {/* <AccordionItem value="vaccinations">
            <AccordionTrigger>
              Vaccinations
              {formState.vaccinations.length > 0 && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {formState.vaccinations.length}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <VaccinationConfig
                modelPreset={formState.modelPreset}
                populationName={formState.populationName}
                startDate={formState.startDate}
                vaccinations={formState.vaccinations}
                settings={formState.vaccinationSettings}
                onChange={(vaccinations) => updateForm({ vaccinations })}
                onSettingsChange={(vaccinationSettings) => updateForm({ vaccinationSettings })}
              />
            </AccordionContent>
          </AccordionItem> */}

        </Accordion>

        <Separator />

        <div>
          <h3 className="font-semibold mb-4">Saved Scenarios</h3>
          <SavedScenarios />
        </div>
      </div>
    </div>
  );
}
