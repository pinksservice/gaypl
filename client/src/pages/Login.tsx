import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

type Mode = "login" | "register" | "forgot";

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Odśwież dane usera po zalogowaniu
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Nieprawidłowy email lub hasło"
        : error.message
      );
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Hasła się nie zgadzają");
      return;
    }
    if (password.length < 6) {
      setError("Hasło musi mieć minimum 6 znaków");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Sprawdź swoją skrzynkę email i potwierdź rejestrację.");
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Link do resetowania hasła został wysłany na Twój email.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2">
            gay<span className="text-primary">.pl</span>
          </h1>
          <p className="text-gray-400 text-lg">
            {mode === "login" && "Dołącz do największej społeczności."}
            {mode === "register" && "Utwórz konto i dołącz do nas."}
            {mode === "forgot" && "Resetuj hasło"}
          </p>
        </div>

        <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl space-y-5 backdrop-blur-xl">

          {/* Błąd / sukces */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-xl">
              {success}
            </div>
          )}

          {/* Formularz logowania */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black font-bold text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logowanie..." : "Zaloguj się"}
              </button>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Zapomniałem hasła
              </button>
            </form>
          )}

          {/* Formularz rejestracji */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="password"
                placeholder="Hasło (min. 6 znaków)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="password"
                placeholder="Powtórz hasło"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black font-bold text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Rejestracja..." : "Zarejestruj się"}
              </button>
            </form>
          )}

          {/* Formularz resetowania hasła */}
          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black font-bold text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Wysyłanie..." : "Wyślij link resetowania"}
              </button>
            </form>
          )}

          {/* Przełącznik trybu */}
          <div className="border-t border-border pt-4 space-y-2">
            {mode !== "login" && (
              <button
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="w-full text-sm text-muted-foreground hover:text-white transition-colors py-2"
              >
                Mam już konto → Zaloguj się
              </button>
            )}
            {mode !== "register" && (
              <button
                onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                className="w-full text-sm text-muted-foreground hover:text-white transition-colors py-2"
              >
                Nie mam konta → Zarejestruj się
              </button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Logując się akceptujesz <Link href="#" className="underline hover:text-white">Regulamin</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
