import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  ModelPresetsResponse,
  PopulationsResponse,
  PopulationDetail,
  ContactMatrices,
} from "@/types/api";

export const modelPresetsQueryOptions = queryOptions({
  queryKey: ["models", "presets"],
  queryFn: () => apiClient<ModelPresetsResponse>("/api/v1/models/presets"),
  staleTime: Infinity,
});

export const populationsQueryOptions = queryOptions({
  queryKey: ["populations"],
  queryFn: () => apiClient<PopulationsResponse>("/api/v1/populations"),
  staleTime: Infinity,
});

export function populationDetailQueryOptions(name: string) {
  return queryOptions({
    queryKey: ["populations", name],
    queryFn: () => apiClient<PopulationDetail>(`/api/v1/populations/${name}`),
    enabled: !!name,
    staleTime: Infinity,
  });
}

export function contactMatricesQueryOptions(name: string, source?: string) {
  return queryOptions({
    queryKey: ["populations", name, "contacts", source],
    queryFn: () => {
      const params = source ? `?source=${source}` : "";
      return apiClient<ContactMatrices>(
        `/api/v1/populations/${name}/contacts${params}`
      );
    },
    enabled: !!name,
    staleTime: 1000 * 60 * 60, // 1 hour (was Infinity)
  });
}
