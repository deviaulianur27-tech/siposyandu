"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecordData } from "@/lib/posyandu/compute";
import {
  ASI_ROWS,
  DS_ROWS,
  LP_SECTIONS,
  PENYULUHAN_ROWS,
  asiTotal,
  dsPercent,
  emptyLaporanData,
  mergeLaporanData,
  n,
  sumGroup,
  sumLp,
  type AsiRow,
  type LaporanData,
  type LpSectionKey,
} from "@/lib/posyandu/laporan-bulanan";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";

type Banner = { type: "success" | "error"; text: string };
type ModalState =
  | { mode: "create" }
  | { mode: "edit"; record: RecordData }
  | null;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

function formatDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function totalSasaran(data: unknown): number {
  const parsed = mergeLaporanData(data);
  const total = sumGroup(parsed.sasaran, Object.keys(parsed.sasaran));
  return total.l + total.p;
}

export default function LaporanBulananWorkspace({
  initialReports,
}: {
  initialReports: RecordData[];
}) {
  const router = useRouter();
  const [reports, setReports] = useState<RecordData[]>(initialReports);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<RecordData | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [banner]);

  function handleSaved(record: RecordData, mode: "create" | "edit") {
    setReports((current) =>
      mode === "create"
        ? [record, ...current]
        : current.map((item) => (item.id === record.id ? record : item)),
    );
    setModal(null);
    setBanner({
      type: "success",
      text:
        mode === "create"
          ? "Laporan bulanan berhasil disimpan."
          : "Laporan bulanan berhasil diperbarui.",
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = String(confirmDelete.id);
    setBusyId(id);
    try {
      const response = await fetch(`/api/posyandu/laporan-bulanan/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) {
        setBanner({
          type: "error",
          text: data.message ?? "Gagal menghapus laporan.",
        });
        return;
      }
      setReports((current) => current.filter((item) => item.id !== id));
      setBanner({ type: "success", text: "Laporan berhasil dihapus." });
      setConfirmDelete(null);
      router.refresh();
    } catch {
      setBanner({ type: "error", text: "Tidak dapat terhubung ke server." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">Posyandu</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Laporan Bulanan
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Laporan Hasil Kegiatan Posyandu di wilayah Puskesmas Montong Betok,
            Kecamatan Montong Gading. Jumlah L+P dihitung otomatis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
        >
          <PlusIcon className="h-4 w-4" />
          Buat Laporan
        </button>
      </header>

      {banner && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {banner.type === "success" ? (
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded p-0.5 opacity-60 transition hover:opacity-100"
            aria-label="Tutup notifikasi"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Laporan tersimpan
          </h2>
          <p className="text-xs text-slate-500">
            {reports.length} laporan. Klik ikon pensil untuk membuka rincian.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Bulan / Tahun</th>
                <th className="px-5 py-3 font-semibold">Tanggal</th>
                <th className="px-5 py-3 font-semibold">Dusun</th>
                <th className="px-5 py-3 font-semibold">Desa</th>
                <th className="px-5 py-3 font-semibold">Total sasaran</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report) => (
                <tr
                  key={String(report.id)}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {String(report.bulanTahun ?? "—")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {formatDate(report.tanggal)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {String(report.dusun ?? "—")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {String(report.desa ?? "—")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {totalSasaran(report.data)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "edit", record: report })}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                        aria-label="Ubah laporan"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(report)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Hapus laporan"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reports.length === 0 && (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium text-slate-600">
              Belum ada laporan bulanan
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Klik “Buat Laporan” untuk mengisi laporan hasil kegiatan.
            </p>
          </div>
        )}
      </section>

      {modal && (
        <LaporanFormModal
          record={modal.mode === "edit" ? modal.record : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => !busyId && setConfirmDelete(null)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h2 className="text-base font-semibold text-slate-900">
              Hapus laporan?
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Laporan {String(confirmDelete.bulanTahun ?? "")} akan dihapus
              permanen.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={Boolean(busyId)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={Boolean(busyId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {busyId ? "Menghapus…" : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LaporanFormModal({
  record,
  onClose,
  onSaved,
}: {
  record?: RecordData;
  onClose: () => void;
  onSaved: (record: RecordData, mode: "create" | "edit") => void;
}) {
  const mode = record ? "edit" : "create";
  const [header, setHeader] = useState({
    posyandu: String(record?.posyandu ?? "Pede Seneng"),
    tanggal: record?.tanggal ? String(record.tanggal).slice(0, 10) : "",
    dusun: String(record?.dusun ?? ""),
    desa: String(record?.desa ?? "Montong Betok"),
    bulanTahun: String(record?.bulanTahun ?? ""),
  });
  const [data, setData] = useState<LaporanData>(() =>
    record ? mergeLaporanData(record.data) : emptyLaporanData(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const sasaranTotal = useMemo(
    () => sumGroup(data.sasaran, Object.keys(data.sasaran)),
    [data.sasaran],
  );

  function setGroupValue(
    key: LpSectionKey,
    row: string,
    side: "l" | "p",
    value: string,
  ) {
    setData((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [row]: { ...current[key][row], [side]: value },
      },
    }));
  }

  function setDsValue(row: string, side: "d" | "s", value: string) {
    setData((current) => ({
      ...current,
      ds: {
        ...current.ds,
        [row]: { ...current.ds[row], [side]: value },
      },
    }));
  }

  function setAsiValue(
    row: string,
    field: keyof Omit<AsiRow, never>,
    value: string,
  ) {
    setData((current) => ({
      ...current,
      asi: {
        ...current.asi,
        [row]: { ...current.asi[row], [field]: value },
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!header.bulanTahun.trim()) {
      setError("Bulan / Tahun wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        mode === "create"
          ? "/api/posyandu/laporan-bulanan"
          : `/api/posyandu/laporan-bulanan/${record?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            posyandu: header.posyandu,
            tanggal: header.tanggal,
            dusun: header.dusun,
            desa: header.desa,
            bulanTahun: header.bulanTahun,
            data,
          }),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        record?: RecordData;
      };

      if (!response.ok || !payload.record) {
        setError(payload.message ?? "Gagal menyimpan laporan.");
        setSaving(false);
        return;
      }

      onSaved(payload.record, mode);
    } catch {
      setError("Tidak dapat terhubung ke server.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => !saving && onClose()}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-5xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "create" ? "Buat Laporan Bulanan" : "Ubah Laporan Bulanan"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Isi kolom putih. Kolom abu-abu (Jumlah / D/S / Total) dihitung
              otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-5" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Identitas Laporan
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-500">
                Posyandu
                <input
                  value={header.posyandu}
                  onChange={(event) =>
                    setHeader({ ...header, posyandu: event.target.value })
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Tanggal Posyandu
                <input
                  type="date"
                  value={header.tanggal}
                  onChange={(event) =>
                    setHeader({ ...header, tanggal: event.target.value })
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Dusun
                <input
                  value={header.dusun}
                  onChange={(event) =>
                    setHeader({ ...header, dusun: event.target.value })
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Desa
                <input
                  value={header.desa}
                  onChange={(event) =>
                    setHeader({ ...header, desa: event.target.value })
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Bulan / Tahun <span className="text-rose-500">*</span>
                <input
                  value={header.bulanTahun}
                  onChange={(event) =>
                    setHeader({ ...header, bulanTahun: event.target.value })
                  }
                  placeholder="contoh: November 2026"
                  className={`${inputClass} mt-1`}
                />
              </label>
            </div>
          </section>

          <section className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Rincian Laporan
            </h3>

            {LP_SECTIONS.map((section) => (
              <LpTable
                key={section.key}
                title={section.title}
                rows={section.rows}
                group={data[section.key]}
                onChange={(row, side, value) =>
                  setGroupValue(section.key, row, side, value)
                }
                total={
                  section.key === "sasaran"
                    ? { l: String(sasaranTotal.l), p: String(sasaranTotal.p) }
                    : undefined
                }
              />
            ))}

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
                12. Penyuluhan di Posyandu (isi jumlah sasaran / “Ya”)
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-4 py-2 font-semibold">No</th>
                    <th className="px-4 py-2 font-semibold">Uraian</th>
                    <th className="w-40 px-4 py-2 font-semibold">Jumlah / Ya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PENYULUHAN_ROWS.map((row, index) => (
                    <tr key={row}>
                      <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                      <td className="px-4 py-2 text-slate-600">{row}</td>
                      <td className="px-4 py-2">
                        <input
                          value={data.penyuluhan[row] ?? ""}
                          onChange={(event) =>
                            setData((current) => ({
                              ...current,
                              penyuluhan: {
                                ...current.penyuluhan,
                                [row]: event.target.value,
                              },
                            }))
                          }
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
                13–15. Kunjungan Kelompok Usia (D/S)
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-4 py-2 font-semibold">No</th>
                    <th className="px-4 py-2 font-semibold">Kelompok</th>
                    <th className="px-4 py-2 font-semibold">D (hadir)</th>
                    <th className="px-4 py-2 font-semibold">S (sasaran)</th>
                    <th className="px-4 py-2 font-semibold">D/S (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DS_ROWS.map((row, index) => (
                    <tr key={row}>
                      <td className="px-4 py-2 text-slate-400">{index + 13}</td>
                      <td className="px-4 py-2 font-medium text-slate-700">{row}</td>
                      <td className="px-4 py-2">
                        <NumberInput
                          value={data.ds[row]?.d ?? ""}
                          onChange={(value) => setDsValue(row, "d", value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <NumberInput
                          value={data.ds[row]?.s ?? ""}
                          onChange={(value) => setDsValue(row, "s", value)}
                        />
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {dsPercent(data.ds[row] ?? { d: "", s: "" }) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
                16. ASI Eksklusif (AE)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                      <th className="w-10 px-3 py-2 font-semibold">No</th>
                      <th className="px-3 py-2 font-semibold">Umur</th>
                      <th className="px-3 py-2 font-semibold">Bayi Ada L</th>
                      <th className="px-3 py-2 font-semibold">Bayi Ada P</th>
                      <th className="px-3 py-2 font-semibold">AE L</th>
                      <th className="px-3 py-2 font-semibold">AE P</th>
                      <th className="px-3 py-2 font-semibold">Tidak AE L</th>
                      <th className="px-3 py-2 font-semibold">Tidak AE P</th>
                      <th className="px-3 py-2 font-semibold">Total Bayi Ada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ASI_ROWS.map((row, index) => {
                      const asi = data.asi[row];
                      return (
                        <tr key={row}>
                          <td className="px-3 py-2 text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-700">
                            {row}
                          </td>
                          {(
                            [
                              "adaL",
                              "adaP",
                              "aeL",
                              "aeP",
                              "tidakAeL",
                              "tidakAeP",
                            ] as const
                          ).map((field) => (
                            <td key={field} className="px-3 py-2">
                              <NumberInput
                                value={asi?.[field] ?? ""}
                                onChange={(value) =>
                                  setAsiValue(row, field, value)
                                }
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 text-slate-600">
                            {asiTotal(
                              asi ?? {
                                adaL: "",
                                adaP: "",
                                aeL: "",
                                aeP: "",
                                tidakAeL: "",
                                tidakAeP: "",
                              },
                            ) || "—"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50/70 font-semibold text-slate-800">
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2">TOTAL</td>
                      {(
                        [
                          "adaL",
                          "adaP",
                          "aeL",
                          "aeP",
                          "tidakAeL",
                          "tidakAeP",
                        ] as const
                      ).map((field) => (
                        <td key={field} className="px-3 py-2">
                          {ASI_ROWS.reduce(
                            (total, row) => total + n(data.asi[row]?.[field]),
                            0,
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {ASI_ROWS.reduce(
                          (total, row) =>
                            total +
                            n(data.asi[row]?.adaL) +
                            n(data.asi[row]?.adaP),
                          0,
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
                Kader Posyandu
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
                <label className="text-xs font-medium text-slate-500">
                  Kader yang Ada
                  <input
                    value={data.kader.hadir}
                    onChange={(event) =>
                      setData((current) => ({
                        ...current,
                        kader: { ...current.kader, hadir: event.target.value },
                      }))
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Kader yang Aktif
                  <input
                    value={data.kader.aktif}
                    onChange={(event) =>
                      setData((current) => ({
                        ...current,
                        kader: { ...current.kader, aktif: event.target.value },
                      }))
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="text-xs font-medium text-slate-500 sm:col-span-3">
                  Catatan Lain
                  <textarea
                    value={data.kader.catatan}
                    onChange={(event) =>
                      setData((current) => ({
                        ...current,
                        kader: { ...current.kader, catatan: event.target.value },
                      }))
                    }
                    rows={2}
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan Laporan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
    />
  );
}

function LpTable({
  title,
  rows,
  group,
  onChange,
  total,
}: {
  title: string;
  rows: readonly string[];
  group: Record<string, { l: string; p: string }>;
  onChange: (row: string, side: "l" | "p", value: string) => void;
  total?: { l: string; p: string };
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
        {title}
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
            <th className="w-10 px-4 py-2 font-semibold">No</th>
            <th className="px-4 py-2 font-semibold">Uraian</th>
            <th className="w-28 px-4 py-2 font-semibold">L</th>
            <th className="w-28 px-4 py-2 font-semibold">P</th>
            <th className="w-28 px-4 py-2 font-semibold">Jumlah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const value = group[row] ?? { l: "", p: "" };
            return (
              <tr key={row}>
                <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                <td className="px-4 py-2 text-slate-600">{row}</td>
                <td className="px-4 py-2">
                  <NumberInput
                    value={value.l}
                    onChange={(next) => onChange(row, "l", next)}
                  />
                </td>
                <td className="px-4 py-2">
                  <NumberInput
                    value={value.p}
                    onChange={(next) => onChange(row, "p", next)}
                  />
                </td>
                <td className="px-4 py-2 font-medium text-slate-700">
                  {sumLp(value) || "—"}
                </td>
              </tr>
            );
          })}
          {total && (
            <tr className="bg-slate-50/70 font-semibold text-slate-800">
              <td className="px-4 py-2" />
              <td className="px-4 py-2">Total sasaran</td>
              <td className="px-4 py-2">{total.l || "0"}</td>
              <td className="px-4 py-2">{total.p || "0"}</td>
              <td className="px-4 py-2">
                {String(n(total.l) + n(total.p))}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
