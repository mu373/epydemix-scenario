/**
 * Color palettes for visualization
 *
 * Separate palettes ensure consistent semantic meaning:
 * - SCENARIO_COLORS: Cool/muted tones for distinguishing scenarios
 * - COMPARTMENT_COLORS: Warm/vibrant tones for compartments & transitions
 * - DEMOGRAPHIC_COLORS: Neutral/earth tones for age groups & demographics
 */

// Scenarios - cool/muted blues, teals, indigos
export const SCENARIO_COLORS = [
  "#6366f1", // indigo
  "#0ea5e9", // sky blue
  "#14b8a6", // teal
  "#8b5cf6", // violet
  "#64748b", // slate
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#0284c7", // darker sky
];

// Compartments & Transitions - original palette
export const COMPARTMENT_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

// Demographics (age groups, etc.) - distinct categorical colors
export const DEMOGRAPHIC_COLORS = [
  "#0891b2", // cyan
  "#db2777", // pink/rose
  "#059669", // emerald
  "#ca8a04", // gold
  "#9333ea", // purple
  "#ea580c", // orange
  "#65a30d", // lime
  "#be185d", // magenta
];

// Helper to get color by index with cycling
export function getScenarioColor(index: number): string {
  return SCENARIO_COLORS[index % SCENARIO_COLORS.length];
}

export function getCompartmentColor(index: number): string {
  return COMPARTMENT_COLORS[index % COMPARTMENT_COLORS.length];
}

export function getDemographicColor(index: number): string {
  return DEMOGRAPHIC_COLORS[index % DEMOGRAPHIC_COLORS.length];
}
