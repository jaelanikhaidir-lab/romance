/**
 * Pure math functions extracted from OrbitingFrames.tsx for testability.
 * These are the core calculations for scatter/orbit positioning.
 */

// ── Constants ───────────────────────────────────────────────────────

export const FRAME_W = 0.9;
export const FRAME_H = 1.2;
export const INSET = 0.06;
export const BASE_RADIUS = 5;
export const WOBBLE_AMP = 0.6;
export const WOBBLE_FREQ = 2;
export const ORBIT_SPEED = 0.12;
export const SCATTER_RADIUS = 12;

// ── Types ───────────────────────────────────────────────────────────

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface OrbitConfig {
    baseRadius: number;
    wobbleAmp: number;
    wobbleFreq: number;
    orbitSpeed: number;
    countOffset: number; // extra radius from count * 0.008
}

// ── Functions ───────────────────────────────────────────────────────

/**
 * Generate a random point on a spherical shell.
 * The radius is between 0.5*scatterRadius and scatterRadius.
 * Y axis is compressed by 0.5 for a flattened distribution.
 */
export function randomScatterPoint(scatterRadius: number = SCATTER_RADIUS): Vec3 {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = scatterRadius * (0.5 + Math.random() * 0.5);
    return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta) * 0.5,
        z: r * Math.cos(phi),
    };
}

/**
 * Compute the orbit position of a frame at a given index.
 */
export function computeOrbitPosition(
    index: number,
    count: number,
    elapsedTime: number,
    config: OrbitConfig = {
        baseRadius: BASE_RADIUS,
        wobbleAmp: WOBBLE_AMP,
        wobbleFreq: WOBBLE_FREQ,
        orbitSpeed: ORBIT_SPEED,
        countOffset: 0,
    }
): Vec3 {
    const radius = config.baseRadius + config.countOffset;
    const baseAngle = elapsedTime * config.orbitSpeed;
    const angle = baseAngle + (index / count) * Math.PI * 2;
    const wobble =
        Math.sin(angle * config.wobbleFreq + index * 0.5) * config.wobbleAmp;

    return {
        x: Math.cos(angle) * radius,
        y: wobble,
        z: Math.sin(angle) * radius,
    };
}

/**
 * Linearly interpolate between orbit and scatter positions.
 * mix=0 → orbit, mix=1 → scatter, 0.5 → midpoint
 */
export function lerpPosition(orbit: Vec3, scatter: Vec3, mix: number): Vec3 {
    return {
        x: orbit.x + (scatter.x - orbit.x) * mix,
        y: orbit.y + (scatter.y - orbit.y) * mix,
        z: orbit.z + (scatter.z - orbit.z) * mix,
    };
}
