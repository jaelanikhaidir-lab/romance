"use client";

import { useState, useCallback } from "react";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { Card, Spinner } from "@/components/ui";
import { useGalleryStore, type GalleryImage } from "@/store/gallery-store";

export function ImageManager() {
  const images = useGalleryStore((s) => s.images);
  const addImage = useGalleryStore((s) => s.addImage);
  const deleteImage = useGalleryStore((s) => s.deleteImage);

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      setUploading(true);
      setError(null);

      try {
        // Get signed params from our API
        const sigRes = await fetch("/api/admin/cloudinary-signature", {
          method: "POST",
        });
        if (!sigRes.ok) throw new Error("Failed to get upload signature");
        const sig = await sigRes.json();

        for (const file of Array.from(files)) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", sig.api_key);
          formData.append("timestamp", String(sig.timestamp));
          formData.append("signature", sig.signature);
          formData.append("folder", sig.folder);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
            { method: "POST", body: formData }
          );
          if (!uploadRes.ok) throw new Error("Cloudinary upload failed");

          const uploadData = await uploadRes.json();

          await addImage({
            url: uploadData.secure_url,
            public_id: uploadData.public_id,
            width: uploadData.width,
            height: uploadData.height,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        // Reset the input so same file can be re-selected
        e.target.value = "";
      }
    },
    [addImage]
  );

  const handleDelete = useCallback(
    async (img: GalleryImage) => {
      if (!window.confirm("Delete this image?")) return;
      setDeletingId(img.id);
      setError(null);
      try {
        await deleteImage(img.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      } finally {
        setDeletingId(null);
      }
    },
    [deleteImage]
  );

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            Image Manager
          </h2>
          <span className="text-sm text-muted">({images.length})</span>
        </div>

        <label className="relative">
          <span
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-soft ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Images"}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-400">{error}</p>
      )}

      {uploading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Spinner className="h-4 w-4" /> Uploading to Cloudinary...
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted">
          <ImageIcon className="h-10 w-10 opacity-40" />
          <p className="text-sm">No images yet. Upload some!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-surface-light"
            >
              <img
                src={img.url}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
              />
              <button
                onClick={() => handleDelete(img)}
                disabled={deletingId === img.id}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
                title="Delete image"
              >
                {deletingId === img.id ? (
                  <Spinner className="h-3.5 w-3.5 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
