import { describe, it, expect } from "vitest";
import {
    signSession,
    verifySession,
    SESSION_COOKIE,
    COOKIE_OPTIONS,
} from "@/lib/auth/session";

describe("JWT Session Utilities", () => {
    // ── signSession ──────────────────────────────────────────────────

    describe("signSession", () => {
        it("returns a non-empty JWT string", async () => {
            const token = await signSession("admin");
            expect(typeof token).toBe("string");
            expect(token.length).toBeGreaterThan(0);
        });

        it("returns a token with 3 dot-separated parts (JWT format)", async () => {
            const token = await signSession("admin");
            const parts = token.split(".");
            expect(parts).toHaveLength(3);
        });

        it("produces different tokens for different usernames", async () => {
            const token1 = await signSession("alice");
            const token2 = await signSession("bob");
            expect(token1).not.toBe(token2);
        });
    });

    // ── verifySession ────────────────────────────────────────────────

    describe("verifySession", () => {
        it("verifies a valid token and returns the username", async () => {
            const token = await signSession("testuser");
            const payload = await verifySession(token);
            expect(payload).not.toBeNull();
            expect(payload!.username).toBe("testuser");
        });

        it("returns null for garbage token", async () => {
            const payload = await verifySession("not.a.real.token");
            expect(payload).toBeNull();
        });

        it("returns null for empty string", async () => {
            const payload = await verifySession("");
            expect(payload).toBeNull();
        });

        it("returns null for a tampered token", async () => {
            const token = await signSession("admin");
            // Flip a character in the signature part
            const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
            const payload = await verifySession(tampered);
            expect(payload).toBeNull();
        });

        it("round-trip: sign then verify preserves username", async () => {
            const usernames = ["admin", "user123", "alice@example.com"];
            for (const username of usernames) {
                const token = await signSession(username);
                const payload = await verifySession(token);
                expect(payload).not.toBeNull();
                expect(payload!.username).toBe(username);
            }
        });

        it("payload includes standard JWT claims (iat, exp)", async () => {
            const token = await signSession("admin");
            const payload = await verifySession(token);
            expect(payload).not.toBeNull();
            expect(payload!.iat).toBeDefined();
            expect(payload!.exp).toBeDefined();
            expect(typeof payload!.iat).toBe("number");
            expect(typeof payload!.exp).toBe("number");
            // exp should be after iat
            expect(payload!.exp!).toBeGreaterThan(payload!.iat!);
        });
    });

    // ── Constants ────────────────────────────────────────────────────

    describe("exported constants", () => {
        it("SESSION_COOKIE is 'session'", () => {
            expect(SESSION_COOKIE).toBe("session");
        });

        it("COOKIE_OPTIONS has required properties", () => {
            expect(COOKIE_OPTIONS.httpOnly).toBe(true);
            expect(COOKIE_OPTIONS.sameSite).toBe("lax");
            expect(COOKIE_OPTIONS.path).toBe("/");
            // In test environment, secure should be false
            expect(typeof COOKIE_OPTIONS.secure).toBe("boolean");
        });
    });
});
