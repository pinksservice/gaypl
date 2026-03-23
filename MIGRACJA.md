# gay.pl — Migracja z Replit na Railway + Supabase

## Co zostało zmienione

Tylko 5 plików (reszta kodu bez zmian):

| Plik | Zmiana |
|------|--------|
| `server/supabaseAuth.ts` | NOWY — middleware JWT zamiast Replit OpenID |
| `server/replit_integrations/auth/index.ts` | Eksportuje z supabaseAuth zamiast replitAuth |
| `server/replit_integrations/auth/routes.ts` | /api/auth/user używa Supabase |
| `client/src/lib/supabase.ts` | NOWY — klient Supabase dla frontendu |
| `client/src/hooks/use-auth.ts` | Wysyła JWT Bearer token zamiast session cookie |
| `client/src/pages/Login.tsx` | Formularz email/hasło zamiast przycisku Replit |

---

## Krok 1 — Supabase

1. Wejdź na [supabase.com](https://supabase.com) i utwórz nowy projekt
2. Poczekaj ~2 minuty na setup
3. Idź do **Project Settings → API** i skopiuj:
   - `Project URL` → `SUPABASE_URL` i `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Idź do **Project Settings → Database → Connection string**
   - Wybierz **Transaction mode** (port 6543)
   - Skopiuj → `DATABASE_URL`
5. W Supabase Dashboard → **Authentication → Providers**:
   - Email: włącz (domyślnie włączone)
   - Opcjonalnie: Google, Facebook

---

## Krok 2 — Instalacja zależności

```bash
npm install @supabase/supabase-js
```

Usuń nieużywane paczki Replit z `package.json`:
```bash
npm uninstall openid-client passport passport-local memoizee
```

---

## Krok 3 — Baza danych

Uruchom migracje żeby utworzyć tabele:
```bash
npm run db:push
```

---

## Krok 4 — Railway

1. Wejdź na [railway.app](https://railway.app) i zaloguj się GitHubem
2. **New Project → Deploy from GitHub repo**
3. Wybierz repozytorium `gaypl`
4. Po deployu idź do **Variables** i dodaj wszystkie zmienne z `.env.example`
5. Railway automatycznie buduje i uruchamia aplikację

Darmowy plan: **500h/miesiąc** (wystarczy na ciągłą pracę ~21 dni).

---

## Krok 5 — Domena

W Railway → **Settings → Networking → Generate Domain**
Dostaniesz darmową domenę: `gaypl-production.up.railway.app`

Albo podepnij własną domenę gaypl.xyz:
- Railway → Custom Domain → wpisz `gaypl.xyz`
- W DNS dodaj CNAME record wskazujący na Railway

---

## Weryfikacja

Po deployu sprawdź:
- `https://twoja-domena.railway.app/` — strona działa
- Rejestracja emailem działa
- Logowanie działa
- Admin panel dostępny dla isAdmin: true

---

## Problemy?

**"Invalid JWT"** — sprawdź czy `SUPABASE_SERVICE_ROLE_KEY` jest poprawny (nie anon key)

**"Cannot find module @supabase/supabase-js"** — uruchom `npm install` lokalnie i spushuj `package-lock.json`

**Baza nie działa** — sprawdź `DATABASE_URL`, musi być Transaction mode (port 6543), nie Direct connection
