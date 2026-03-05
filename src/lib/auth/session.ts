import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const ALG = "HS256";
const EXPIRATION = "24h";

export interface SessionPayload extends JWTPayload {
  username: string;
}

/** Create a signed JWT with the admin username embedded. */
export async function signSession(username: string): Promise<string> {
  return new SignJWT({ username } satisfies SessionPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(SECRET);
}

/** Verify a JWT and return its payload, or `null` if invalid/expired. */
export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Cookie name used for the admin session. */
export const SESSION_COOKIE = "session";

/** Cookie options shared between set and clear. */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
