import type { RequestHandler, Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Klient z service role key - tylko po stronie serwera
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Middleware - weryfikuje JWT z headera Authorization
// Zachowuje req.user.claims.sub żeby reszta routes.ts działała BEZ ZMIAN
export const isAuthenticated: RequestHandler = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Zachowujemy interfejs req.user.claims.sub - nic w routes.ts nie wymaga zmian
    req.user = {
      claims: {
        sub: user.id,
        email: user.email,
      },
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Opcjonalne - nie blokuje, ale dodaje usera jeśli token jest
export const optionalAuth: RequestHandler = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        req.user = { claims: { sub: user.id, email: user.email } };
      }
    } catch {}
  }

  next();
};
