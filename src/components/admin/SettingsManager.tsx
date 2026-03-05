"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { useGalleryStore, type SiteSettings } from "@/store/gallery-store";

export function SettingsManager() {
  const settings = useGalleryStore((s) => s.settings);
  const updateSettings = useGalleryStore((s) => s.updateSettings);

  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync form when store settings change (e.g. after fetch)
  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const dirty =
    form.sphere_color !== settings.sphere_color ||
    form.floating_text !== settings.floating_text ||
    form.target_name !== settings.target_name ||
    form.particle_count !== settings.particle_count;

  const handleChange = useCallback(
    (key: keyof SiteSettings, value: string | number) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setSaved(false);
    },
    []
  );

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);
      setSaved(false);
      try {
        await updateSettings(form);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [form, updateSettings]
  );

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">
          Site Settings
        </h2>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Sphere Color */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Sphere Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.sphere_color}
              onChange={(e) => handleChange("sphere_color", e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-surface"
            />
            <Input
              value={form.sphere_color}
              onChange={(e) => handleChange("sphere_color", e.target.value)}
              placeholder="#e8a87c"
              className="flex-1 font-mono"
            />
          </div>
        </div>

        {/* Floating Text */}
        <Input
          label="Floating Text"
          value={form.floating_text}
          onChange={(e) => handleChange("floating_text", e.target.value)}
          placeholder="Only For U"
          maxLength={100}
        />

        {/* Target Name */}
        <Input
          label="Target Name"
          value={form.target_name}
          onChange={(e) => handleChange("target_name", e.target.value)}
          placeholder="My Love"
          maxLength={50}
        />

        {/* Particle Count */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Photo Frame Count
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={500}
              value={form.particle_count}
              onChange={(e) =>
                handleChange("particle_count", Number(e.target.value))
              }
              className="flex-1 accent-accent"
            />
            <span className="w-12 text-right text-sm tabular-nums text-foreground">
              {form.particle_count}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && (
          <p className="text-sm text-green-400">Settings saved!</p>
        )}

        <Button
          type="submit"
          disabled={!dirty}
          loading={saving}
          icon={<Save className="h-4 w-4" />}
          className="mt-1 self-start"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Card>
  );
}
