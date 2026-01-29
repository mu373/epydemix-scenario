import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { SimulationRequest, SimulationResponse } from "@/types/api";

export function useRunSimulation() {
  return useMutation({
    mutationFn: (request: SimulationRequest) =>
      apiClient<SimulationResponse>("/api/v1/simulations", {
        method: "POST",
        body: JSON.stringify(request),
      }),
  });
}
