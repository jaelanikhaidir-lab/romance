"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import type { Group } from "three";
import { useGalleryStore } from "@/store/gallery-store";

export function FloatingMessage() {
  const { floating_text, target_name } = useGalleryStore((s) => s.settings);
  const groupRef = useRef<Group>(null);
  const displayTargetName =
    floating_text === "Only For U" && target_name === "My Love"
      ? "Pendek."
      : target_name;
  const baseX = 0;
  const baseY = 5.2;
  const baseZ = 0;

  useFrame((state) => {
    if (!groupRef.current) return;
    // Gentle floating animation
    groupRef.current.position.set(
      baseX,
      baseY + Math.sin(state.clock.elapsedTime * 0.5) * 0.15,
      baseZ
    );
  });

  return (
    <group ref={groupRef}>
      <Billboard>
        <Text
          fontSize={0.62}
          color="#f0e6d3"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#e8a87c"
        >
          {floating_text}, {displayTargetName}
        </Text>
      </Billboard>
    </group>
  );
}
