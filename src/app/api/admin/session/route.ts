import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifySession(token);
  if (!payload) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    username: payload.username,
  });
}
