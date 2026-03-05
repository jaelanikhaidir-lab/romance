"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCinematicStore } from "@/store/cinematic-store";

export function CenterSphere() {
  const pointsRef   = useRef<THREE.Points>(null);
  const matRef      = useRef<THREE.PointsMaterial>(null);
  const isInside    = useCinematicStore((s) => s.isInsideHeart);

  const particleCount = 10500;

  // Soft radial sprite so each particle has a subtle glow.
  const circleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      const glow = context.createRadialGradient(32, 32, 4, 32, 32, 32);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.35, "rgba(255,255,255,0.85)");
      glow.addColorStop(0.75, "rgba(255,255,255,0.25)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Generate a point cloud in the shape of a 3D heart
  /* eslint-disable react-hooks/purity */
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    let i = 0;

    // Heart implicit equation: (x^2 + 9/4*y^2 + z^2 - 1)^3 - x^2*z^3 - 9/80*y^2*z^3 <= 0
    // Mapped to Three.js coordinates (Y is up)
    while (i < particleCount) {
      // Random point in bounding box [-1.5, 1.5]
      const x = (Math.random() - 0.5) * 3;
      const y = (Math.random() - 0.5) * 3;
      const z = (Math.random() - 0.5) * 3;

      const x2 = x * x;
      const y2 = y * y;
      const z2 = z * z;
      const y3 = y * y * y;

      const a = x2 + 2.25 * z2 + y2 - 1;
      const val = a * a * a - x2 * y3 - 0.1125 * z2 * y3;

      if (val <= 0.0) {
        // Bigger shape than before so "Love 3D" looks more dominant.
        pos[i * 3] = x * 3.1;
        pos[i * 3 + 1] = y * 3.1;
        pos[i * 3 + 2] = z * 3.1;
        i++;
      }
    }
    return pos;
  }, [particleCount]);
  /* eslint-enable react-hooks/purity */

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;

    // Smooth rotation
    pointsRef.current.rotation.y = t * 0.2;

    // Subtle pulsing heartbeat effect
    const scale = 1 + Math.sin(t * 3) * 0.03 + Math.sin(t * 1.5) * 0.05;
    pointsRef.current.scale.set(scale, scale, scale);

    // Fade particles when camera is inside the heart so text is legible
    if (matRef.current) {
      const targetOpacity = isInside ? 0.28 : 0.88;
      matRef.current.opacity += (targetOpacity - matRef.current.opacity) * 0.04;
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={0.078}
          color="#ff2a2a"
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
          toneMapped={false}
          map={circleTexture}
          alphaTest={0.001}
        />
      </points>
      {/* Light so orbit particles still get illuminated */}
      <pointLight
        color="#ff2a2a"
        intensity={2}
        distance={20}
        decay={2}
      />
    </group>
  );
}

