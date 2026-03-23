// Eksportujemy z supabaseAuth zamiast replitAuth
// routes.ts importuje z tego pliku - nic nie trzeba zmieniać w routes.ts
export { isAuthenticated, supabaseAdmin } from "../../supabaseAuth";
export { registerAuthRoutes } from "./routes";

// setupAuth - w Supabase nie potrzeba konfiguracji serwera
// (sesje obsługuje Supabase SDK po stronie klienta)
// Zostawiamy pustą funkcję żeby import w routes.ts się nie sypał
export async function setupAuth(app: any): Promise<void> {
  // Supabase Auth nie wymaga konfiguracji Express
  // JWT weryfikowany jest w middleware isAuthenticated
  console.log("[auth] Supabase Auth ready");
}
