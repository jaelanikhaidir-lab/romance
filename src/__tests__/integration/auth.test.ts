import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock cookies() from next/headers ────────────────────────────────
const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
};
vi.mock("next/headers", () => ({
    cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// ── Mock Supabase ────────────────────────────────────────────────────
vi.mock("@/lib/supabase-admin", () => ({
    getSupabaseAdmin: vi.fn(),
}));

// ── Import after mocks are set up ────────────────────────────────────
import { POST as loginHandler } from "@/app/api/admin/login/route";
import { signSession, verifySession } from "@/lib/auth/session";

// ── Helpers ──────────────────────────────────────────────────────────

function makeRequest(body: unknown, headers?: Record<string, string>): Request {
    return new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "127.0.0.1",
            ...headers,
        },
        body: JSON.stringify(body),
    });
}

function makeInvalidRequest(): Request {
    return new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "invalid-json-test",
        },
        body: "not json {{{",
    });
}

// ═══════════════════════════════════════════════════════════════════
// Auth Integration Tests
// ═══════════════════════════════════════════════════════════════════

describe("POST /api/admin/login", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns ok:true with valid credentials", async () => {
        const req = makeRequest(
            { username: "admin", password: "secret123" },
            { "x-forwarded-for": "valid-creds-test" }
        );
        const res = await loginHandler(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.ok).toBe(true);
    });

    it("sets session cookie on successful login", async () => {
        const req = makeRequest(
            { username: "admin", password: "secret123" },
            { "x-forwarded-for": "cookie-test" }
        );
        await loginHandler(req);

        expect(mockCookieStore.set).toHaveBeenCalledWith(
            "session",
            expect.any(String),
            expect.objectContaining({
                httpOnly: true,
                path: "/",
                maxAge: 86400,
            })
        );
    });

    it("returns 401 for wrong password", async () => {
        const req = makeRequest(
            { username: "admin", password: "wrong-password" },
            { "x-forwarded-for": "wrong-pass-test" }
        );
        const res = await loginHandler(req);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe("Invalid username or password");
    });

    it("returns 401 for wrong username", async () => {
        const req = makeRequest(
            { username: "hacker", password: "secret123" },
            { "x-forwarded-for": "wrong-user-test" }
        );
        const res = await loginHandler(req);

        expect(res.status).toBe(401);
    });

    it("returns 400 for invalid JSON body", async () => {
        const req = makeInvalidRequest();
        const res = await loginHandler(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe("Invalid JSON body");
    });

    it("returns 400 for empty body fields", async () => {
        const req = makeRequest(
            { username: "", password: "" },
            { "x-forwarded-for": "empty-body-test" }
        );
        const res = await loginHandler(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe("Validation failed");
    });

    it("rate limits after MAX_ATTEMPTS (5) from same IP", async () => {
        // Use a unique IP to avoid contamination from other tests
        const uniqueIp = `rate-limit-test-${Date.now()}`;

        // First 5 attempts (even with wrong creds) should not be rate-limited
        for (let i = 0; i < 5; i++) {
            const req = makeRequest(
                { username: "admin", password: "wrong" },
                { "x-forwarded-for": uniqueIp }
            );
            const res = await loginHandler(req);
            expect(res.status).not.toBe(429);
        }

        // 6th attempt should be rate-limited
        const req = makeRequest(
            { username: "admin", password: "secret123" },
            { "x-forwarded-for": uniqueIp }
        );
        const res = await loginHandler(req);
        const data = await res.json();

        expect(res.status).toBe(429);
        expect(data.error).toContain("Too many login attempts");
    });
});

// ═══════════════════════════════════════════════════════════════════
// JWT sign/verify integration (used by the auth flow)
// ═══════════════════════════════════════════════════════════════════

describe("JWT Session Integration", () => {
    it("token generated by signSession can be verified", async () => {
        const token = await signSession("admin");
        const payload = await verifySession(token);
        expect(payload).not.toBeNull();
        expect(payload!.username).toBe("admin");
    });

    it("expiry is set to 24 hours in the future", async () => {
        const token = await signSession("admin");
        const payload = await verifySession(token);
        expect(payload).not.toBeNull();

        const now = Math.floor(Date.now() / 1000);
        const expectedExp = now + 24 * 60 * 60;
        // Allow 5 seconds tolerance
        expect(payload!.exp!).toBeGreaterThan(expectedExp - 5);
        expect(payload!.exp!).toBeLessThan(expectedExp + 5);
    });
});
