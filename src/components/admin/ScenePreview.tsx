"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { Eye } from "lucide-react";
import { Card, Spinner } from "@/components/ui";
import { CenterSphere } from "@/components/scene/CenterSphere";
import { OrbitingFrames } from "@/components/scene/OrbitingFrames";
import { FloatingMessage } from "@/components/scene/FloatingMessage";
import { useGalleryStore } from "@/store/gallery-store";

function PreviewCanvas() {
  const triggerScatter = useGalleryStore((s) => s.triggerScatter);

  return (
    <div
      className="h-full w-full cursor-grab active:cursor-grabbing"
      onDoubleClick={triggerScatter}
    >
      <Canvas
        camera={{ position: [0, 2, 10], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#050505" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 5]} intensity={0.15} />

        <Stars
          radius={100}
          depth={50}
          count={2000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />

        <Suspense fallback={null}>
          <CenterSphere />
          <OrbitingFrames />
          <FloatingMessage />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={20}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}

export function ScenePreview() {
  const status = useGalleryStore((s) => s.status);

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Eye className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Live Preview</h2>
        <span className="text-xs text-muted">Double-click to scatter</span>
      </div>

      <div className="relative aspect-video w-full">
        {status !== "ready" ? (
          <div className="flex h-full items-center justify-center bg-surface">
            <Spinner size="md" />
          </div>
        ) : (
          <PreviewCanvas />
        )}
      </div>
    </Card>
  );
}
