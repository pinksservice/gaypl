import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useEvents(city?: string) {
  return useQuery({
    queryKey: [api.events.list.path, city],
    queryFn: async () => {
      const url = api.events.list.path;
      const queryParams = new URLSearchParams();
      if (city) queryParams.append("city", city);

      const res = await fetch(`${url}?${queryParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return api.events.list.responses[200].parse(await res.json());
    },
  });
}

export function usePlaces(filters?: { city?: string; type?: string }) {
  return useQuery({
    queryKey: [api.places.list.path, filters],
    queryFn: async () => {
      const url = api.places.list.path;
      const queryParams = new URLSearchParams();
      if (filters?.city) queryParams.append("city", filters.city);
      if (filters?.type) queryParams.append("type", filters.type);

      const res = await fetch(`${url}?${queryParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch places");
      return api.places.list.responses[200].parse(await res.json());
    },
  });
}
