"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  Link as LinkIcon,
  QrCode,
  Sparkles,
  Users,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { slugifyClientName } from "@/lib/client-slug";
import { useGalleryStore, type GalleryClient } from "@/store/gallery-store";

function getBaseSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

function buildClientUrl(slug: string): string {
  return `${getBaseSiteUrl()}/${slug}`;
}

export function ClientManager() {
  const clients = useGalleryStore((s) => s.clients);
  const selectedClientId = useGalleryStore((s) => s.selectedClientId);
  const fetchAdminClients = useGalleryStore((s) => s.fetchAdminClients);
  const setSelectedClient = useGalleryStore((s) => s.setSelectedClient);
  const createClient = useGalleryStore((s) => s.createClient);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (clients.length === 0) {
      void fetchAdminClients();
    }
  }, [clients.length, fetchAdminClients]);

  const previewSlug = useMemo(() => {
    const generated = slugifyClientName(name);
    return slugTouched ? slugifyClientName(slug) : generated;
  }, [name, slug, slugTouched]);

  const handleCreateClient = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);

      try {
        const client = await createClient({
          name,
          slug: slugTouched ? slug : undefined,
        });

        setName("");
        setSlug("");
        setSlugTouched(false);
        setSelectedClient(client.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create client");
      } finally {
        setSubmitting(false);
      }
    },
    [createClient, name, setSelectedClient, slug, slugTouched]
  );

  const handleCopyLink = useCallback(async (client: GalleryClient) => {
    const clientUrl = buildClientUrl(client.slug);
    await navigator.clipboard.writeText(clientUrl);
    setCopiedSlug(client.slug);
    window.setTimeout(() => setCopiedSlug(null), 1800);
  }, []);

  const handleDownloadQr = useCallback(async (client: GalleryClient) => {
    setDownloadingSlug(client.slug);
    try {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(buildClientUrl(client.slug), {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 960,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${client.slug}-qr.png`;
      anchor.click();
    } finally {
      setDownloadingSlug(null);
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-[linear-gradient(135deg,rgba(232,168,124,0.16),transparent_65%)] px-6 py-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-semibold text-foreground">
              Manajemen Klien
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Buat pasangan baru, pilih client aktif untuk dashboard, lalu download QR
            code yang langsung mengarah ke halaman `/{"<slug>"}`.
          </p>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,360px)_1fr]">
          <form onSubmit={handleCreateClient} className="space-y-4 rounded-2xl border border-border bg-surface-light p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-foreground">
                Buat Client Baru
              </h2>
            </div>

            <Input
              label="Nama Pasangan"
              value={name}
              onChange={(e) => {
                const nextName = e.target.value;
                setName(nextName);
                if (!slugTouched) {
                  setSlug(slugifyClientName(nextName));
                }
              }}
              placeholder="Alya & Reza"
              maxLength={100}
              required
            />

            <Input
              label="Slug URL"
              value={slugTouched ? slug : previewSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="alya-reza"
              maxLength={100}
            />

            <div className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted">
              Preview URL: <span className="font-mono text-foreground">{buildClientUrl(previewSlug || "client-baru")}</span>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" loading={submitting} disabled={!name.trim()}>
              {submitting ? "Membuat..." : "Buat Client"}
            </Button>
          </form>

          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-light px-6 py-10 text-center text-muted">
                <QrCode className="mb-3 h-10 w-10 opacity-50" />
                <p className="text-sm">Belum ada client. Buat client pertama di panel sebelah kiri.</p>
              </div>
            ) : (
              clients.map((client) => {
                const isSelected = client.id === selectedClientId;
                const publicUrl = buildClientUrl(client.slug);

                return (
                  <div
                    key={client.id}
                    className={`rounded-2xl border p-5 transition ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border bg-surface-light"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
                          {isSelected && (
                            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-black">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-sm text-accent">/{client.slug}</p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                          <LinkIcon className="h-4 w-4" />
                          <Link href={`/${client.slug}`} className="truncate hover:text-foreground" target="_blank">
                            {publicUrl}
                          </Link>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={isSelected ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => setSelectedClient(client.id)}
                          icon={isSelected ? <Check className="h-4 w-4" /> : undefined}
                        >
                          {isSelected ? "Dipilih" : "Pilih di Dashboard"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleCopyLink(client)}
                          icon={<Copy className="h-4 w-4" />}
                        >
                          {copiedSlug === client.slug ? "Tersalin" : "Copy Link"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleDownloadQr(client)}
                          loading={downloadingSlug === client.slug}
                          icon={<Download className="h-4 w-4" />}
                        >
                          Download QR
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}