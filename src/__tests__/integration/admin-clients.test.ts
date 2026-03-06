import { beforeEach, describe, expect, it, vi } from "vitest";

function createChainMock() {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn(() => chain);
    chain.insert = vi.fn(() => chain);
    chain.update = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.single = vi.fn(() => chain);
    chain.then = undefined as unknown as ReturnType<typeof vi.fn>;
    return chain;
}

let chainMock = createChainMock();
const mockFrom = vi.fn(() => chainMock);

vi.mock("@/lib/supabase-admin", () => ({
    getSupabaseAdmin: () => ({
        from: mockFrom,
    }),
}));

import { GET as getAdminClients, POST as postAdminClient } from "@/app/api/admin/clients/route";
import { PUT as putAdminClient } from "@/app/api/admin/clients/[id]/route";

function makeRequest(path: string, method: string, body?: unknown): Request {
    const init: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (body !== undefined) {
        init.body = JSON.stringify(body);
    }
    return new Request(`http://localhost:3000${path}`, init);
}

describe("GET /api/admin/clients", () => {
    beforeEach(() => {
        chainMock = createChainMock();
        mockFrom.mockReturnValue(chainMock);
    });

    it("returns clients array on success", async () => {
        const clients = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                slug: "alya-reza",
                name: "Alya & Reza",
            },
        ];
        chainMock.order.mockResolvedValue({ data: clients, error: null });

        const res = await getAdminClients();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.clients).toEqual(clients);
        expect(mockFrom).toHaveBeenCalledWith("clients");
    });
});

describe("POST /api/admin/clients", () => {
    beforeEach(() => {
        chainMock = createChainMock();
        mockFrom.mockReturnValue(chainMock);
    });

    it("creates a client and auto-generates a slug", async () => {
        const createdClient = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            slug: "alya-reza",
            name: "Alya & Reza",
            sphere_color: "#e8a87c",
            floating_text: "Only For U",
            target_name: "Pendek.",
            particle_count: 50,
            music_url: "/message-in-a-bottle-taylor-swift.mp3",
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
        };

        chainMock.single.mockResolvedValue({ data: createdClient, error: null });

        const res = await postAdminClient(
            makeRequest("/api/admin/clients", "POST", { name: "Alya & Reza" })
        );
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.client).toEqual(createdClient);
        expect(chainMock.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Alya & Reza",
                slug: "alya-reza",
            })
        );
    });

    it("retries with a suffixed slug when the first slug already exists", async () => {
        const duplicateChain = createChainMock();
        duplicateChain.single.mockResolvedValue({
            data: null,
            error: { code: "23505", message: "duplicate key" },
        });

        const successChain = createChainMock();
        successChain.single.mockResolvedValue({
            data: {
                id: "550e8400-e29b-41d4-a716-446655440000",
                slug: "alya-reza-2",
                name: "Alya & Reza",
                sphere_color: "#e8a87c",
                floating_text: "Only For U",
                target_name: "Pendek.",
                particle_count: 50,
                music_url: "/message-in-a-bottle-taylor-swift.mp3",
                created_at: "2024-01-01",
                updated_at: "2024-01-01",
            },
            error: null,
        });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
            callCount += 1;
            return callCount === 1 ? duplicateChain : successChain;
        });

        const res = await postAdminClient(
            makeRequest("/api/admin/clients", "POST", { name: "Alya & Reza" })
        );
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.client.slug).toBe("alya-reza-2");
        expect(successChain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ slug: "alya-reza-2" })
        );
    });
});

describe("PUT /api/admin/clients/[id]", () => {
    beforeEach(() => {
        chainMock = createChainMock();
        mockFrom.mockReturnValue(chainMock);
    });

    it("updates client-specific settings", async () => {
        const updatedClient = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            slug: "alya-reza",
            name: "Alya & Reza",
            sphere_color: "#ff5500",
            floating_text: "Love You",
            target_name: "Darling",
            particle_count: 100,
            music_url: "/audio/love.mp3",
            created_at: "2024-01-01",
            updated_at: "2024-01-02",
        };

        chainMock.single.mockResolvedValue({ data: updatedClient, error: null });

        const res = await putAdminClient(
            makeRequest("/api/admin/clients/550e8400-e29b-41d4-a716-446655440000", "PUT", {
                sphere_color: "#ff5500",
                floating_text: "Love You",
                target_name: "Darling",
                particle_count: 100,
                music_url: "/audio/love.mp3",
            }),
            {
                params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
            }
        );
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.client).toEqual(updatedClient);
        expect(chainMock.update).toHaveBeenCalledWith({
            sphere_color: "#ff5500",
            floating_text: "Love You",
            target_name: "Darling",
            particle_count: 100,
            music_url: "/audio/love.mp3",
        });
    });
});