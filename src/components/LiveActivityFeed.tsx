"use client";

import { useCallback } from "react";
import { useLiveQuery } from "@neon/realtime-react";
import type { SealedLiveQuery } from "@neon/realtime/client";
import type { ActivityRow } from "@/lib/realtime";
import { formatDateTime } from "@/lib/format";

const ACTION_LABEL: Record<string, string> = {
  LOGIN_SUCCESS: "Berhasil masuk",
  LOGIN_FAILED: "Gagal masuk",
  LOGIN_BLOCKED: "Akun diblokir",
  LOGOUT: "Keluar",
};

const ACTION_STYLE: Record<string, string> = {
  LOGIN_SUCCESS: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LOGIN_FAILED: "bg-rose-50 text-rose-700 ring-rose-200",
  LOGIN_BLOCKED: "bg-amber-50 text-amber-700 ring-amber-200",
  LOGOUT: "bg-slate-100 text-slate-600 ring-slate-200",
};

const STATUS_STYLE: Record<string, string> = {
  live: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  connecting: "bg-amber-50 text-amber-700 ring-amber-200",
  stale: "bg-amber-50 text-amber-700 ring-amber-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
  error: "bg-rose-50 text-rose-700 ring-rose-200",
};

const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  connecting: "Menyambung…",
  stale: "Menunggu perpanjangan",
  closed: "Terputus",
  error: "Error",
};

export default function LiveActivityFeed({
  sealedQuery,
  initialData,
  isAdmin,
}: {
  sealedQuery: SealedLiveQuery<ActivityRow>;
  initialData: ActivityRow[];
  isAdmin: boolean;
}) {
  // Dipanggil otomatis 10 detik sebelum capability kedaluwarsa.
  const refreshQuery = useCallback(async () => {
    const response = await fetch("/api/realtime/activity", {
      method: "POST",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Gagal memperbarui live query (${response.status})`);
    }
    return (await response.json()) as SealedLiveQuery<ActivityRow>;
  }, []);

  const { data, status, error } = useLiveQuery<ActivityRow>(sealedQuery, {
    initialData,
    refreshQuery,
  });

  const rows = data ?? initialData;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Aktivitas terbaru
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin
              ? "Log masuk dan keluar seluruh pengguna, diperbarui langsung."
              : "Riwayat aktivitas akun Anda, diperbarui langsung."}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
            STATUS_STYLE[status] ?? STATUS_STYLE.closed
          }`}
          title={error?.message}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "live"
                ? "bg-emerald-500"
                : status === "error"
                  ? "bg-rose-500"
                  : "bg-amber-500"
            }`}
          />
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      {error && (
        <p className="border-b border-rose-100 bg-rose-50 px-5 py-2 text-xs text-rose-700">
          Live update berhenti: {error.message}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((log) => (
            <li
              key={log.id}
              className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                      ACTION_STYLE[log.action] ??
                      "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-700">
                    {log.user_name ?? log.email ?? "Pengguna tidak dikenal"}
                  </span>
                </div>
                {log.detail && (
                  <p className="mt-0.5 text-xs text-slate-400">{log.detail}</p>
                )}
              </div>
              <p className="shrink-0 text-xs text-slate-400">
                {formatDateTime(log.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
