"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { AlertCircle } from "lucide-react";
import { useGalleryStore } from "@/store/gallery-store";
import { Spinner } from "@/components/ui";
import { ImageManager } from "@/components/admin/ImageManager";
import { SettingsManager } from "@/components/admin/SettingsManager";

const ScenePreview = dynamic(
  () =>
    import("@/components/admin/ScenePreview").then((m) => ({
      default: m.ScenePreview,
    })),
  { ssr: false }
);

export default function AdminDashboardPage() {
  const status = useGalleryStore((s) => s.status);
  const error = useGalleryStore((s) => s.error);
  const fetchAdminImages = useGalleryStore((s) => s.fetchAdminImages);
  const fetchAdminSettings = useGalleryStore((s) => s.fetchAdminSettings);

  useEffect(() => {
    fetchAdminImages();
    fetchAdminSettings();
  }, [fetchAdminImages, fetchAdminSettings]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-900/20 px-4 py-2.5 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Live 3D preview */}
      <ScenePreview />

      {/* Two-column layout on larger screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsManager />
        <ImageManager />
      </div>
    </div>
  );
}
