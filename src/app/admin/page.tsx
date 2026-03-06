"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertCircle, Users } from "lucide-react";
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
  const clients = useGalleryStore((s) => s.clients);
  const selectedClientId = useGalleryStore((s) => s.selectedClientId);
  const client = useGalleryStore((s) => s.client);
  const status = useGalleryStore((s) => s.status);
  const error = useGalleryStore((s) => s.error);
  const fetchAdminClients = useGalleryStore((s) => s.fetchAdminClients);
  const fetchAdminImages = useGalleryStore((s) => s.fetchAdminImages);

  useEffect(() => {
    void fetchAdminClients();
  }, [fetchAdminClients]);

  useEffect(() => {
    if (selectedClientId) {
      void fetchAdminImages(selectedClientId);
    }
  }, [fetchAdminImages, selectedClientId]);

  if ((status === "idle" || status === "loading") && clients.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="rounded-full bg-accent/10 p-4 text-accent">
          <Users className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Belum ada client yang dibuat</h1>
          <p className="text-sm leading-6 text-muted">
            Buat pasangan pertama terlebih dahulu agar upload foto, preview scene, dan QR code
            bisa langsung dipakai dari admin panel.
          </p>
        </div>
        <Link
          href="/admin/clients"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition hover:bg-accent-soft"
        >
          Buka Manajemen Klien
        </Link>
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted">Client Aktif</p>
          <h1 className="mt-1 text-xl font-semibold text-foreground">
            {client ? client.name : "Belum dipilih"}
          </h1>
          {client && <p className="text-sm text-accent">/{client.slug}</p>}
        </div>
        <Link
          href="/admin/clients"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-light px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/50 hover:text-accent"
        >
          Kelola Client & QR
        </Link>
      </div>

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
