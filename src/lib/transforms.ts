import type {
  SimulationResponse,
  QuantileData,
  AgeGroup,
  Scenario,
} from "@/types/api";

export interface TrajectoryDataPoint {
  date: string;
  median: number;
  q025: number;
  q975: number;
  q25: number;
  q75: number;
}

export interface ComparisonDataPoint extends TrajectoryDataPoint {
  scenarioId: string;
  scenarioName: string;
}

export function transformTrajectoryData(
  response: SimulationResponse,
  compartment: string,
  ageGroup: string = "total"
): TrajectoryDataPoint[] {
  const { results } = response;

  // Get dates from compartments
  const dates = results?.compartments?.dates;
  if (!dates || dates.length === 0) {
    return [];
  }

  // Get data for the specified compartment and age group
  const quantiles = results.compartments?.data?.[compartment]?.[ageGroup];
  if (!quantiles) {
    return [];
  }

  return dates.map((date, i) => ({
    date,
    median: quantiles["0.5"]?.[i] ?? 0,
    q025: quantiles["0.025"]?.[i] ?? 0,
    q975: quantiles["0.975"]?.[i] ?? 0,
    q25: quantiles["0.25"]?.[i] ?? 0,
    q75: quantiles["0.75"]?.[i] ?? 0,
  }));
}

export function transformTransitionData(
  response: SimulationResponse,
  transition: string,
  ageGroup: string = "total"
): TrajectoryDataPoint[] {
  const { results } = response;

  // Get dates from transitions
  const dates = results?.transitions?.dates;
  if (!dates || dates.length === 0) {
    return [];
  }

  // Get data for the specified transition and age group
  const quantiles = results.transitions?.data?.[transition]?.[ageGroup];
  if (!quantiles) {
    return [];
  }

  return dates.map((date, i) => ({
    date,
    median: quantiles["0.5"]?.[i] ?? 0,
    q025: quantiles["0.025"]?.[i] ?? 0,
    q975: quantiles["0.975"]?.[i] ?? 0,
    q25: quantiles["0.25"]?.[i] ?? 0,
    q75: quantiles["0.75"]?.[i] ?? 0,
  }));
}

export function transformComparisonData(
  scenarios: Scenario[],
  compartment: string,
  ageGroup?: string
): ComparisonDataPoint[] {
  return scenarios.flatMap((scenario) => {
    const data = transformTrajectoryData(
      scenario.response,
      compartment,
      ageGroup
    );
    return data.map((point) => ({
      ...point,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
    }));
  });
}

export interface SummaryMetric {
  label: string;
  median: number;
  ci95: [number, number];
  peakDate?: string;
}

export function transformSummaryMetrics(
  response: SimulationResponse
): SummaryMetric[] {
  const summary = response?.results?.summary;
  const metrics: SummaryMetric[] = [];

  if (!summary) return metrics;

  if (summary.peaks) {
    for (const [name, data] of Object.entries(summary.peaks)) {
      metrics.push({
        label: `Peak ${name}`,
        median: data.median,
        ci95: data.ci_95,
        peakDate: data.peak_date,
      });
    }
  }

  if (summary.totals) {
    for (const [name, data] of Object.entries(summary.totals)) {
      metrics.push({
        label: `Total ${name.replace(/_/g, " ")}`,
        median: data.median,
        ci95: data.ci_95,
      });
    }
  }

  return metrics;
}

export interface PopulationChartData {
  name: string;
  population: number;
  percentage: number;
}

export function transformPopulationData(
  ageGroups: AgeGroup[],
  total: number
): PopulationChartData[] {
  return ageGroups.map((group) => ({
    name: group.name,
    population: group.population,
    percentage: (group.population / total) * 100,
  }));
}

export interface HeatmapCell {
  x: number;
  y: number;
  xLabel: string;
  yLabel: string;
  value: number;
}

export function transformContactMatrix(
  matrix: number[][],
  ageGroups: string[]
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      cells.push({
        x: j,
        y: i,
        xLabel: ageGroups[j],
        yLabel: ageGroups[i],
        value: matrix[i][j],
      });
    }
  }

  return cells;
}

export function formatNumber(value: number): string {
  if (value >= 1e9) {
    return (value / 1e9).toFixed(1) + "B";
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(1) + "M";
  }
  if (value >= 1e3) {
    return (value / 1e3).toFixed(1) + "K";
  }
  return value.toFixed(0);
}

export function generateCSV(
  scenarios: Scenario[],
  compartment: string,
  ageGroup: string = "total"
): string {
  const headers = [
    "Scenario",
    "Date",
    "Median",
    "Q2.5",
    "Q25",
    "Q75",
    "Q97.5",
  ];
  const rows: string[][] = [headers];

  for (const scenario of scenarios) {
    const data = transformTrajectoryData(
      scenario.response,
      compartment,
      ageGroup
    );
    for (const point of data) {
      rows.push([
        scenario.name,
        point.date,
        point.median.toString(),
        point.q025.toString(),
        point.q25.toString(),
        point.q75.toString(),
        point.q975.toString(),
      ]);
    }
  }

  return rows.map((row) => row.join(",")).join("\n");
}
