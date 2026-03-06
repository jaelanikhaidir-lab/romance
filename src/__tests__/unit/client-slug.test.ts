import { describe, expect, it } from "vitest";
import { slugifyClientName } from "@/lib/client-slug";

describe("slugifyClientName", () => {
    it("converts names into lowercase kebab-case slugs", () => {
        expect(slugifyClientName("Alya & Reza Forever")).toBe("alya-reza-forever");
    });

    it("removes accents and repeated separators", () => {
        expect(slugifyClientName(" Éléonore   +  Bima ")).toBe("eleonore-bima");
    });
});