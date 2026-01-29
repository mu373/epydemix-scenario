"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParameterSchema {
  key: string;
  label: string;
  type: "float" | "discrete";
  min?: number;
  max?: number;
  step?: number;
  default: number | string;
  options?: string[];
  description?: string;
}

// Parameter schemas by model type (from API)
const MODEL_PARAM_SCHEMAS: Record<string, ParameterSchema[]> = {
  "SEIR": [
    { key: "R0", label: "R₀", type: "float", min: 0.1, max: 20.0, step: 0.1, default: 2.5 },
    { key: "incubation_period", label: "Incubation Period (days)", type: "float", min: 0.5, max: 30.0, step: 0.5, default: 5.0 },
    { key: "infectious_period", label: "Infectious Period (days)", type: "float", min: 0.5, max: 30.0, step: 0.5, default: 5.0 },
  ],
  "SIR": [
    { key: "R0", label: "R₀", type: "float", min: 0.1, max: 20.0, step: 0.1, default: 2.5 },
    { key: "infectious_period", label: "Infectious Period (days)", type: "float", min: 0.5, max: 30.0, step: 0.5, default: 5.0 },
  ],
  "SIS": [
    { key: "R0", label: "R₀", type: "float", min: 0.1, max: 20.0, step: 0.1, default: 2.5 },
    { key: "infectious_period", label: "Infectious Period (days)", type: "float", min: 0.5, max: 30.0, step: 0.5, default: 5.0 },
  ],
  "SEIRS": [
    { key: "R0", label: "R₀", type: "float", min: 0.1, max: 20.0, step: 0.1, default: 1.5 },
    { key: "incubation_period", label: "Incubation Period (days)", type: "float", min: 0.5, max: 20.0, step: 0.5, default: 1.5 },
    { key: "infectious_period", label: "Infectious Period (days)", type: "float", min: 0.5, max: 20.0, step: 0.5, default: 1.5 },
    { key: "waning_immunity_period", label: "Waning Immunity Period (days)", type: "float", min: 5.0, max: 1000.0, step: 5.0, default: 365.0 },
    { key: "seasonality_peak_day", label: "Seasonality Peak Day", type: "float", min: 1, max: 365, step: 1, default: 125 },
    { key: "seasonality_amplitude", label: "Seasonality", type: "discrete", default: "Medium", options: ["Strong", "Moderate", "Medium", "Low", "None"] },
  ],
  "SEIHR": [
    { key: "R0", label: "R₀", type: "float", min: 0.1, max: 20.0, step: 0.1, default: 2.5 },
    { key: "incubation_period", label: "Incubation Period (days)", type: "float", min: 0.5, max: 20.0, step: 0.5, default: 3.0 },
    { key: "infectious_period", label: "Infectious Period (days)", type: "float", min: 0.5, max: 20.0, step: 0.5, default: 2.5 },
    { key: "hospital_stay", label: "Hospital Stay (days)", type: "float", min: 0, max: 25.0, step: 1.0, default: 5.0 },
    { key: "ph_0", label: "Hosp. % (0-4 yrs)", type: "float", min: 0, max: 100.0, step: 0.1, default: 0.2 },
    { key: "ph_1", label: "Hosp. % (5-19 yrs)", type: "float", min: 0, max: 100.0, step: 0.1, default: 0.5 },
    { key: "ph_2", label: "Hosp. % (20-49 yrs)", type: "float", min: 0, max: 100.0, step: 0.1, default: 1.5 },
    { key: "ph_3", label: "Hosp. % (50-64 yrs)", type: "float", min: 0, max: 100.0, step: 0.1, default: 5.0 },
    { key: "ph_4", label: "Hosp. % (65+ yrs)", type: "float", min: 0, max: 100.0, step: 0.1, default: 18.0 },
  ],
};

// Disease presets - parameter values for common diseases
export const DISEASE_PRESETS: Record<string, {
  label: string;
  model: string;
  parameters: Record<string, number | string>;
  initialConditions: { infected_pct: number; immune_pct: number };
}> = {
  "Measles": {
    label: "Measles",
    model: "SEIR",
    parameters: { R0: 12.0, incubation_period: 11.0, infectious_period: 9.0 },
    initialConditions: { infected_pct: 0.1, immune_pct: 85.0 },
  },
  "Influenza": {
    label: "Influenza",
    model: "SEIRS",
    parameters: {
      R0: 1.5, incubation_period: 1.5, infectious_period: 1.5,
      waning_immunity_period: 365, seasonality_peak_day: 125, seasonality_amplitude: "Medium"
    },
    initialConditions: { infected_pct: 0.1, immune_pct: 25.0 },
  },
  "COVID-19": {
    label: "COVID-19",
    model: "SEIHR",
    parameters: {
      R0: 2.5, incubation_period: 3.0, infectious_period: 2.5, hospital_stay: 5.0,
      ph_0: 0.2, ph_1: 0.5, ph_2: 1.5, ph_3: 5.0, ph_4: 18.0
    },
    initialConditions: { infected_pct: 0.1, immune_pct: 25.0 },
  },
};

// Default schema for unknown models
const DEFAULT_SCHEMA: ParameterSchema[] = MODEL_PARAM_SCHEMAS["SEIR"];

interface ModelParametersProps {
  modelPreset: string;
  parameters: Record<string, number | string>;
  onChange: (parameters: Record<string, number | string>) => void;
}

export function ModelParameters({
  modelPreset,
  parameters,
  onChange,
}: ModelParametersProps) {
  const schema = MODEL_PARAM_SCHEMAS[modelPreset] || DEFAULT_SCHEMA;

  const handleChange = (key: string, value: number | string) => {
    onChange({ ...parameters, [key]: value });
  };

  // Ensure all schema parameters have values
  const ensuredParams = { ...parameters };
  for (const param of schema) {
    if (ensuredParams[param.key] === undefined) {
      ensuredParams[param.key] = param.default;
    }
  }

  // Get R0 for display
  const r0 = ensuredParams.R0 as number;

  return (
    <div className="space-y-4">
      {/* R₀ highlight box */}
      {r0 !== undefined && (
        <div className="rounded-lg bg-muted p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">R₀ Value</span>
            <span className="text-lg font-bold">{Number(r0).toFixed(1)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {r0 > 1
              ? "Epidemic will spread (R₀ > 1)"
              : r0 === 1
              ? "Endemic equilibrium (R₀ = 1)"
              : "Epidemic will die out (R₀ < 1)"}
          </p>
        </div>
      )}

      {schema.map((param) => {
        const value = ensuredParams[param.key];

        if (param.type === "discrete" && param.options) {
          return (
            <div key={param.key} className="space-y-2">
              <Label>{param.label}</Label>
              <Select
                value={String(value)}
                onValueChange={(v) => handleChange(param.key, v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {param.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {param.description && (
                <p className="text-xs text-muted-foreground">
                  {param.description}
                </p>
              )}
            </div>
          );
        }

        // Float slider
        return (
          <div key={param.key} className="space-y-2">
            <div className="flex justify-between">
              <Label>{param.label}</Label>
              <span className="text-sm text-muted-foreground">
                {typeof value === "number" ? value.toFixed(param.step && param.step < 1 ? 1 : 0) : value}
              </span>
            </div>
            <Slider
              value={[Number(value)]}
              onValueChange={([v]) => handleChange(param.key, v)}
              min={param.min}
              max={param.max}
              step={param.step}
            />
            {param.description && (
              <p className="text-xs text-muted-foreground">
                {param.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Export for use in SetupPanel to get default parameters
export function getDefaultParameters(modelPreset: string): Record<string, number | string> {
  const schema = MODEL_PARAM_SCHEMAS[modelPreset] || DEFAULT_SCHEMA;
  const defaults: Record<string, number | string> = {};
  for (const param of schema) {
    defaults[param.key] = param.default;
  }
  return defaults;
}

// Convert epidemiological parameters to API format
// Converts R0 + periods to transmission_rate + rates using spectral radius
export function convertToApiParameters(
  modelPreset: string,
  params: Record<string, number | string>,
  spectralRadius?: number
): Record<string, number> {
  const result: Record<string, number> = {};

  const infectiousPeriod = params.infectious_period ? Number(params.infectious_period) : undefined;
  const incubationPeriod = params.incubation_period ? Number(params.incubation_period) : undefined;

  // Convert R0 to transmission_rate using spectral radius from API
  // Formula: transmission_rate = R0 * recovery_rate / spectral_radius(C)
  // This matches epydemix-dashboard computation in engine/run.py:145
  if (params.R0 !== undefined && infectiousPeriod && spectralRadius) {
    const recoveryRate = 1 / infectiousPeriod;
    result.transmission_rate = (Number(params.R0) * recoveryRate) / spectralRadius;
  } else if (params.R0 !== undefined) {
    // Fallback: send R0 directly if no spectral radius available
    console.warn("Spectral radius not available, sending R0 directly");
    result.R0 = Number(params.R0);
  }

  // Convert periods to rates (rate = 1/period)
  if (infectiousPeriod) {
    result.recovery_rate = 1 / infectiousPeriod;
  }

  if (incubationPeriod) {
    result.incubation_rate = 1 / incubationPeriod;
  }

  // Handle model-specific parameters
  if (params.waning_immunity_period) {
    result.waning_rate = 1 / Number(params.waning_immunity_period);
  }

  if (params.hospital_stay) {
    result.hospitalization_recovery_rate = 1 / Number(params.hospital_stay);
  }

  // Handle seasonality - convert to numeric minimum transmission multiplier
  // Dashboard values: Strong=0.5, Moderate=0.65, Medium=0.75, Low=0.85, None=1.0
  // Lower values = stronger seasonality (transmission can drop to this fraction of max)
  if (params.seasonality_amplitude) {
    const amplitudeMap: Record<string, number> = {
      "Strong": 0.5,
      "Moderate": 0.65,
      "Medium": 0.75,
      "Low": 0.85,
      "None": 1.0,
    };
    result.seasonality_min = amplitudeMap[String(params.seasonality_amplitude)] ?? 0.75;
  }

  if (params.seasonality_peak_day) {
    result.seasonality_peak_day = Number(params.seasonality_peak_day);
  }

  // Handle age-specific hospitalization probabilities (SEIHR model)
  for (let i = 0; i <= 4; i++) {
    const key = `ph_${i}`;
    if (params[key] !== undefined) {
      result[key] = Number(params[key]);
    }
  }

  return result;
}
