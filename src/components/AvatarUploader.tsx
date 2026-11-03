"use client";

import { useRef, useState } from "react";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AvatarUploader({
  initialUrl,
  name,
}: {
  initialUrl: string | null;
  name: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        message?: string;
        avatarUrl?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Gagal mengunggah avatar");
      }

      setUrl(payload.avatarUrl ?? null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal mengunggah avatar",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Gagal menghapus avatar");
      }
      setUrl(null);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Gagal menghapus avatar",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-base font-semibold text-white">
          {url ? (
            // Presigned URL dari bucket privat, bukan aset statis Next.js.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={`Avatar ${name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            initialsOf(name) || "?"
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
            >
              {busy ? "Mengunggah…" : url ? "Ganti foto" : "Unggah foto"}
            </button>
            {url && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <p className="mt-2 text-[11px] text-slate-400">
        JPG, PNG, WEBP, atau GIF. Maksimal 2 MB. Disimpan di Neon Object
        Storage.
      </p>
    </div>
  );
}
