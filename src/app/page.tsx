"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useGalleryStore } from "@/store/gallery-store";
import { Spinner } from "@/components/ui";
import { InstructionOverlay } from "@/components/scene";

const Scene3D = dynamic(
  () =>
    import("@/components/scene/Scene3D").then((m) => ({
      default: m.Scene3D,
    })),
  { ssr: false }
);

export default function Home() {
  const status = useGalleryStore((s) => s.status);
  const error = useGalleryStore((s) => s.error);
  const fetchPublicData = useGalleryStore((s) => s.fetchPublicData);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted">Lagi bikin gallery...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchPublicData}
            className="rounded bg-accent px-4 py-2 text-sm text-background hover:bg-accent-soft"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      <Scene3D />
      <InstructionOverlay />
    </div>
  );
}

