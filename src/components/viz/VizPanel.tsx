"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScenarioSelector } from "./ScenarioSelector";
import { TrajectoryChart } from "./TrajectoryChart";
import { SummaryMetrics } from "./SummaryMetrics";
import { PopulationChart } from "./PopulationChart";
import { ContactMatrixHeatmap } from "./ContactMatrixHeatmap";

export function VizPanel() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <ScenarioSelector />

      <Tabs defaultValue="trajectories" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 w-full max-w-[600px]">
          <TabsTrigger value="trajectories">Trajectories</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="population">Population</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="trajectories" className="flex-1 mt-4">
          <TrajectoryChart />
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 mt-4">
          <SummaryMetrics />
        </TabsContent>

        <TabsContent value="population" className="flex-1 mt-4">
          <PopulationChart />
        </TabsContent>

        <TabsContent value="contacts" className="flex-1 mt-4">
          <ContactMatrixHeatmap />
        </TabsContent>
      </Tabs>
    </div>
  );
}
