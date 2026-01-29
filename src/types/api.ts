// Model Presets
export interface ModelPreset {
  name: string;
  description: string;
  compartments: string[];
  parameters: Record<string, number>;
  transitions: Transition[];
}

export interface Transition {
  source: string;
  target: string;
  kind: "mediated" | "spontaneous";
  params: string | [string, string];
}

export interface ModelPresetsResponse {
  presets: ModelPreset[];
}

// Populations
export interface PopulationSummary {
  name: string;
  display_name: string;
  total_population: number | null;
  n_age_groups: number | null;
  available_contact_sources: string[];
}

export interface PopulationsResponse {
  populations: PopulationSummary[];
}

export interface AgeGroup {
  name: string;
  population: number;
}

export interface PopulationDetail {
  name: string;
  display_name: string;
  total_population: number;
  age_groups: AgeGroup[];
  contact_sources: string[];
  default_contact_source: string;
  available_layers: string[];
}

export interface ContactMatrices {
  population_name: string;
  contact_source: string;
  layers: Record<string, number[][]>;
  overall: number[][];
  age_groups: string[];
  spectral_radius: Record<string, number>;
}

// Simulation Request
export interface SimulationRequest {
  model: ModelConfig;
  population: PopulationConfig;
  simulation: SimulationConfig;
  initial_conditions: InitialConditionsConfig;
  interventions?: Intervention[];
  vaccinations?: Vaccination[];
  vaccination_settings?: VaccinationSettings;
  output?: OutputConfig;
}

export interface ModelConfig {
  preset?: string;
  custom?: {
    compartments: string[];
    transitions: Transition[];
    parameters: Record<string, number>;
  };
  parameters?: Record<string, number>;
}

export interface PopulationConfig {
  name: string;
  contact_source?: string;
}

export interface SimulationConfig {
  start_date: string;
  end_date: string;
  Nsim?: number;
  dt?: number;
  seed?: number | null;
}

export interface InitialConditionsConfig {
  method: "percentage" | "absolute";
  initial_percentages?: Record<string, number>;
  compartments?: Record<string, number[]>;
}

// API intervention format (what gets sent to backend)
export interface Intervention {
  layer_name: string; // "all" | "home" | "school" | "work" | "community"
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reduction_factor: number; // 0-1 (0.2 = reduce to 20% of normal)
  name?: string;
}

// Frontend intervention format (used in UI)
export interface InterventionFormData {
  layer: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  reduction_pct: number; // 0-100 percentage (user-friendly)
}

// API vaccination format (what gets sent to backend)
export interface Vaccination {
  name: string;
  start_day: number;
  end_day: number;
  coverage: number; // Target coverage as fraction (0-1)
  ve_sus: number; // Vaccine efficacy as fraction (0-1)
  target_age_groups: string[];
  rollout: {
    shape: "flat" | "ramp";
    ramp_up_days?: number;
  };
}

// Frontend vaccination format (used in UI with dates)
export interface VaccinationFormData {
  name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  coverage: number;
  ve_sus: number;
  target_age_groups: string[];
  rollout: {
    shape: "flat" | "ramp";
    ramp_up_days?: number;
  };
}

export interface VaccinationSettings {
  target_compartments: string[]; // Default: ["S"]
}

export interface OutputConfig {
  quantiles?: number[];
  summary?: {
    peak_compartments?: string[];
    total_transitions?: string[];
  };
}

// Simulation Response
export interface SimulationResponse {
  simulation_id: string;
  status: "completed" | "error";
  error?: string;
  metadata: SimulationMetadata;
  results: SimulationResults;
}

export interface SimulationMetadata {
  model_preset: string;
  compartments: string[];
  population_name: string;
  population_size: number;
  n_age_groups: number;
  start_date: string;
  end_date: string;
  n_simulations: number;
  dt: number;
  seed: number | null;
}

export interface SimulationResults {
  compartments: CompartmentResults;
  trajectories: TrajectoryResults;
  transitions: TransitionResults;
  summary: SummaryResults;
}

export interface QuantileData {
  "0.025": number[];
  "0.05": number[];
  "0.25": number[];
  "0.5": number[];
  "0.75": number[];
  "0.95": number[];
  "0.975": number[];
}

export interface CompartmentResults {
  dates: string[];
  data: Record<string, Record<string, QuantileData>>;
}

export interface TrajectoryResults {
  dates: string[];
  data: Record<string, QuantileData>;
}

export interface TransitionResults {
  dates: string[];
  data: Record<string, Record<string, QuantileData>>;
}

export interface SummaryResults {
  peaks?: Record<string, PeakSummary>;
  totals?: Record<string, TotalSummary>;
}

export interface PeakSummary {
  median: number;
  ci_95: [number, number];
  peak_date: string;
}

export interface TotalSummary {
  median: number;
  ci_95: [number, number];
}

// Local State Types
export interface Scenario {
  id: string;
  name: string;
  createdAt: string;
  request: SimulationRequest;
  response: SimulationResponse;
}

export interface Workspace {
  modelPreset: string | null;
  populationName: string | null;
  isLocked: boolean;
}

// Form State
export interface SimulationFormState {
  modelPreset: string;
  populationName: string;
  startDate: string;
  endDate: string;
  nsim: number;
  seed: number | null;
  initialConditions: Record<string, number>;
  parameters: Record<string, number | string>;
  interventions: InterventionFormData[];
  vaccinations: VaccinationFormData[];
  vaccinationSettings: VaccinationSettings;
  // Output summary options
  peakCompartments: string[];
  totalTransitions: string[];
}
