"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { primaryScenarioAtom } from "@/lib/atoms/scenarios";
import {
  populationDetailQueryOptions,
} from "@/lib/api/queries";
import { transformPopulationData, formatNumber } from "@/lib/transforms";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMOGRAPHIC_COLORS } from "@/lib/colors";

export function PopulationChart() {
  const primaryScenario = useAtomValue(primaryScenarioAtom);
  const populationName = primaryScenario?.response.metadata.population_name;

  const { data: population, isLoading } = useQuery(
    populationDetailQueryOptions(populationName || "")
  );

  if (!primaryScenario) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Run a simulation to see population demographics
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!population) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Population data not available
      </div>
    );
  }

  // Sort age groups by starting age
  const sortedAgeGroups = [...population.age_groups].sort((a, b) => {
    const getStartAge = (name: string) => {
      const match = name.match(/^(\d+)/);
      return match ? parseInt(match[1]) : 999; // Put non-numeric at end
    };
    return getStartAge(a.name) - getStartAge(b.name);
  });

  const chartData = transformPopulationData(
    sortedAgeGroups,
    population.total_population
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">{population.display_name}</h3>
        <p className="text-sm text-muted-foreground">
          Total Population: {formatNumber(population.total_population)}
        </p>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="population"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              startAngle={90}
              endAngle={-270}
              label={({ name, payload }) =>
                `${name}: ${(payload?.percentage as number)?.toFixed(1) || 0}%`
              }
              labelLine
              isAnimationActive={false}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={DEMOGRAPHIC_COLORS[index % DEMOGRAPHIC_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm">
                        Population: {formatNumber(data.population)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Age group table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">Age Group</th>
              <th className="text-right p-3">Population</th>
              <th className="text-right p-3">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((group, i) => (
              <tr key={group.name} className="border-t">
                <td className="p-3 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: DEMOGRAPHIC_COLORS[i % DEMOGRAPHIC_COLORS.length] }}
                  />
                  {group.name}
                </td>
                <td className="text-right p-3">
                  {formatNumber(group.population)}
                </td>
                <td className="text-right p-3">{group.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
