import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validators";
import {
  signSession,
  SESSION_COOKIE,
  COOKIE_OPTIONS,
} from "@/lib/auth/session";

// Simple in-memory rate limiter: IP → { count, resetAt }
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  // Parse & validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  // Constant-time-ish comparison against env credentials
  const validUser = process.env.ADMIN_USERNAME ?? "";
  const validPass = process.env.ADMIN_PASSWORD ?? "";

  if (username !== validUser || password !== validPass) {
    return Response.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  // Issue JWT & set cookie
  const token = await signSession(username);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return Response.json({ ok: true });
}
