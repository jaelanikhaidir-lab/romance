import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const SESSION_COOKIE = "session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without auth check.
  if (
    pathname.startsWith("/api/public") ||
    pathname === "/admin/login" ||
    pathname === "/api/admin/login"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return unauthorized(request);
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    // Token invalid or expired, clear the bad cookie before redirecting/rejecting.
    const response = unauthorized(request);
    response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  }
}

function unauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};