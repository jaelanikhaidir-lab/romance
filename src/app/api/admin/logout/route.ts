import { cookies } from "next/headers";
import { SESSION_COOKIE, COOKIE_OPTIONS } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0, // expire immediately
  });

  return Response.json({ ok: true });
}
