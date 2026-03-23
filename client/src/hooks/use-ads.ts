import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertAd } from "@shared/schema";

interface AdsFilters {
  category?: string;
  userLat?: number;
  userLng?: number;
  limit?: number;
  offset?: number;
}

export function useAds(filters?: AdsFilters) {
  return useQuery({
    queryKey: [api.ads.list.path, filters],
    queryFn: async () => {
      const url = api.ads.list.path;
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.append("category", filters.category);
      if (filters?.userLat !== undefined) queryParams.append("userLat", filters.userLat.toString());
      if (filters?.userLng !== undefined) queryParams.append("userLng", filters.userLng.toString());
      if (filters?.limit) queryParams.append("limit", filters.limit.toString());
      if (filters?.offset) queryParams.append("offset", filters.offset.toString());

      const res = await fetch(`${url}?${queryParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ads");
      return res.json();
    },
  });
}

export function useCreateAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAd) => {
      const res = await fetch(api.ads.create.path, {
        method: api.ads.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create ad");
      }
      return api.ads.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ads.list.path] });
    },
  });
}
