import { describe, it, expect } from "vitest";
import {
    randomScatterPoint,
    computeOrbitPosition,
    lerpPosition,
    SCATTER_RADIUS,
    WOBBLE_AMP,
    BASE_RADIUS,
    type Vec3,
} from "@/lib/scene-math";

// ═══════════════════════════════════════════════════════════════════
// randomScatterPoint
// ═══════════════════════════════════════════════════════════════════

describe("randomScatterPoint", () => {
    it("returns an object with x, y, z properties", () => {
        const point = randomScatterPoint();
        expect(point).toHaveProperty("x");
        expect(point).toHaveProperty("y");
        expect(point).toHaveProperty("z");
        expect(typeof point.x).toBe("number");
        expect(typeof point.y).toBe("number");
        expect(typeof point.z).toBe("number");
    });

    it("generates points within expected radius bounds", () => {
        // Run multiple times to avoid flaky randomness
        for (let i = 0; i < 100; i++) {
            const point = randomScatterPoint();
            const distance = Math.sqrt(
                point.x ** 2 + (point.y * 2) ** 2 + point.z ** 2
            );
            // Y is compressed by 0.5, so we undo it for the distance check.
            // The radius r is between 0.5*SCATTER_RADIUS and SCATTER_RADIUS.
            expect(distance).toBeLessThanOrEqual(SCATTER_RADIUS * 1.01); // small tolerance
            expect(distance).toBeGreaterThan(0); // should never be at origin
        }
    });

    it("generates points with compressed Y axis (flattened sphere)", () => {
        // Over many samples, the max |y| should be roughly half the max |x| or |z|
        let maxAbsY = 0;
        let maxAbsXZ = 0;
        for (let i = 0; i < 500; i++) {
            const point = randomScatterPoint();
            maxAbsY = Math.max(maxAbsY, Math.abs(point.y));
            maxAbsXZ = Math.max(maxAbsXZ, Math.abs(point.x), Math.abs(point.z));
        }
        // Y should be noticeably smaller than X/Z due to 0.5 compression
        expect(maxAbsY).toBeLessThan(maxAbsXZ);
    });

    it("multiple calls produce different results", () => {
        const points = Array.from({ length: 10 }, () => randomScatterPoint());
        const uniqueX = new Set(points.map((p) => p.x));
        // With 10 random calls, we should have at least 5 unique x values
        expect(uniqueX.size).toBeGreaterThanOrEqual(5);
    });

    it("respects custom scatter radius", () => {
        const customRadius = 5;
        for (let i = 0; i < 50; i++) {
            const point = randomScatterPoint(customRadius);
            const distance = Math.sqrt(
                point.x ** 2 + (point.y * 2) ** 2 + point.z ** 2
            );
            expect(distance).toBeLessThanOrEqual(customRadius * 1.01);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// computeOrbitPosition
// ═══════════════════════════════════════════════════════════════════

describe("computeOrbitPosition", () => {
    const defaultConfig = {
        baseRadius: BASE_RADIUS,
        wobbleAmp: WOBBLE_AMP,
        wobbleFreq: 2,
        orbitSpeed: 0.12,
        countOffset: 0,
    };

    it("returns a Vec3 with x, y, z", () => {
        const pos = computeOrbitPosition(0, 10, 0, defaultConfig);
        expect(pos).toHaveProperty("x");
        expect(pos).toHaveProperty("y");
        expect(pos).toHaveProperty("z");
    });

    it("position at index 0, time 0 matches expected cos/sin", () => {
        const pos = computeOrbitPosition(0, 10, 0, defaultConfig);
        // At time=0, angle = 0 + (0/10)*2π = 0
        // x = cos(0) * 5 = 5, z = sin(0) * 5 = 0
        expect(pos.x).toBeCloseTo(BASE_RADIUS, 5);
        expect(pos.z).toBeCloseTo(0, 5);
    });

    it("frames are evenly distributed around 2π", () => {
        const count = 4;
        const positions = Array.from({ length: count }, (_, i) =>
            computeOrbitPosition(i, count, 0, defaultConfig)
        );

        // At time=0 with 4 frames:
        // index 0: angle = 0          → x≈5,  z≈0
        // index 1: angle = π/2        → x≈0,  z≈5
        // index 2: angle = π          → x≈-5, z≈0
        // index 3: angle = 3π/2      → x≈0,  z≈-5
        expect(positions[0].x).toBeCloseTo(BASE_RADIUS, 1);
        expect(positions[0].z).toBeCloseTo(0, 1);
        expect(positions[1].x).toBeCloseTo(0, 1);
        expect(positions[1].z).toBeCloseTo(BASE_RADIUS, 1);
        expect(positions[2].x).toBeCloseTo(-BASE_RADIUS, 1);
        expect(positions[2].z).toBeCloseTo(0, 1);
        expect(positions[3].x).toBeCloseTo(0, 1);
        expect(positions[3].z).toBeCloseTo(-BASE_RADIUS, 1);
    });

    it("wobble stays within ±WOBBLE_AMP", () => {
        // Test many time values
        for (let t = 0; t < 100; t += 0.5) {
            for (let i = 0; i < 20; i++) {
                const pos = computeOrbitPosition(i, 20, t, defaultConfig);
                expect(Math.abs(pos.y)).toBeLessThanOrEqual(WOBBLE_AMP + 0.001);
            }
        }
    });

    it("radius increases with countOffset", () => {
        const configWithOffset = { ...defaultConfig, countOffset: 2 };
        const pos = computeOrbitPosition(0, 10, 0, configWithOffset);
        // At angle=0: x = cos(0) * (5+2) = 7
        expect(pos.x).toBeCloseTo(BASE_RADIUS + 2, 5);
    });

    it("position changes over time (orbiting)", () => {
        const pos1 = computeOrbitPosition(0, 10, 0, defaultConfig);
        const pos2 = computeOrbitPosition(0, 10, 10, defaultConfig);
        // Positions should differ since time changed
        expect(pos1.x).not.toBeCloseTo(pos2.x, 2);
    });
});

// ═══════════════════════════════════════════════════════════════════
// lerpPosition
// ═══════════════════════════════════════════════════════════════════

describe("lerpPosition", () => {
    const orbit: Vec3 = { x: 5, y: 0, z: 0 };
    const scatter: Vec3 = { x: -5, y: 10, z: 8 };

    it("mix=0 returns orbit position exactly", () => {
        const result = lerpPosition(orbit, scatter, 0);
        expect(result.x).toBe(orbit.x);
        expect(result.y).toBe(orbit.y);
        expect(result.z).toBe(orbit.z);
    });

    it("mix=1 returns scatter position exactly", () => {
        const result = lerpPosition(orbit, scatter, 1);
        expect(result.x).toBe(scatter.x);
        expect(result.y).toBe(scatter.y);
        expect(result.z).toBe(scatter.z);
    });

    it("mix=0.5 returns midpoint", () => {
        const result = lerpPosition(orbit, scatter, 0.5);
        expect(result.x).toBeCloseTo(0, 5);
        expect(result.y).toBeCloseTo(5, 5);
        expect(result.z).toBeCloseTo(4, 5);
    });

    it("mix=0.25 returns 25% towards scatter", () => {
        const result = lerpPosition(orbit, scatter, 0.25);
        expect(result.x).toBeCloseTo(2.5, 5);
        expect(result.y).toBeCloseTo(2.5, 5);
        expect(result.z).toBeCloseTo(2, 5);
    });

    it("returns same type (Vec3) regardless of input", () => {
        const result = lerpPosition(orbit, scatter, 0.5);
        expect(result).toHaveProperty("x");
        expect(result).toHaveProperty("y");
        expect(result).toHaveProperty("z");
        expect(typeof result.x).toBe("number");
    });
});
