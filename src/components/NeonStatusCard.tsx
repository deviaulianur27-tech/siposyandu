"use client";

import { useCallback, useEffect, useState } from "react";

type ServiceCheck = {
  ok: boolean;
  latencyMs: number;
  detail: string;
};

type StatusResponse = {
  checkedAt: string;
  branch: string | null;
  services: Record<string, ServiceCheck>;
};

const SERVICE_LABEL: Record<string, string> = {
  postgres: "Postgres",
  auth: "Neon Auth",
  objectStorage: "Object Storage",
  functions: "Functions",
  realtime: "Realtime",
};

const SERVICE_ORDER = [
  "postgres",
  "auth",
  "objectStorage",
  "functions",
  "realtime",
];

export default function NeonStatusCard() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/neon/status", { cache: "no-store" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(payload.message ?? `Status ${response.status}`);
      }
      setData((await response.json()) as StatusResponse);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Gagal memeriksa layanan Neon",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allOk =
    data &&
    SERVICE_ORDER.every((name) => data.services[name]?.ok === true);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Status layanan Neon
          </h2>
          <p className="text-xs text-slate-500">
            {data?.branch ? `Branch ${data.branch}` : "Pemeriksaan langsung"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
        >
          {loading ? "Memeriksa…" : "Periksa lagi"}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}

      {data && (
        <>
          <ul className="mt-4 space-y-2.5">
            {SERVICE_ORDER.map((name) => {
              const service = data.services[name];
              if (!service) return null;

              return (
                <li key={name} className="flex items-start gap-2.5">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      service.ok ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">
                        {SERVICE_LABEL[name] ?? name}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {service.latencyMs} ms
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-500" title={service.detail}>
                      {service.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
            {allOk ? "Semua layanan terhubung" : "Ada layanan yang gagal"} ·
            diperiksa{" "}
            {new Date(data.checkedAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
      )}
    </section>
  );
}
