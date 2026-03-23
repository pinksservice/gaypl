import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useArticles(category?: string) {
  return useQuery({
    queryKey: [api.articles.list.path, category],
    queryFn: async () => {
      const url = buildUrl(api.articles.list.path);
      const queryParams = new URLSearchParams();
      if (category) queryParams.append("category", category);

      const res = await fetch(`${url}?${queryParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      return api.articles.list.responses[200].parse(await res.json());
    },
  });
}

export function useArticle(id: number) {
  return useQuery({
    queryKey: [api.articles.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.articles.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch article");
      return api.articles.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
