import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated, supabaseAdmin } from "../supabaseAuth";

export function registerAuthRoutes(app: Express): void {

  // Zwraca zalogowanego usera (wywołuje frontend przez use-auth.ts)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Pobierz lub utwórz usera w naszej bazie
      let user = await authStorage.getUser(userId);

      if (!user) {
        // Pierwszy login - utwórz rekord w bazie
        const { data: { user: supabaseUser } } = await supabaseAdmin.auth.admin.getUserById(userId);

        user = await authStorage.upsertUser({
          id: userId,
          email: supabaseUser?.email ?? null,
          firstName: supabaseUser?.user_metadata?.first_name ?? null,
          lastName: supabaseUser?.user_metadata?.last_name ?? null,
          profileImageUrl: supabaseUser?.user_metadata?.avatar_url ?? null,
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout - po stronie klienta Supabase SDK wywołuje signOut()
  // Ten endpoint zostawiamy dla kompatybilności ale nic nie robi po stronie serwera
  app.get("/api/logout", (req, res) => {
    res.json({ message: "ok" });
  });
}
