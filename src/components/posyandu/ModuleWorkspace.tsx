"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  displayValue,
  getField,
  getModuleConfig,
  type FieldConfig,
  type ModuleConfig,
} from "@/lib/posyandu/modules";
import { BULAN, type RecordData } from "@/lib/posyandu/compute";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";

type Banner = { type: "success" | "error"; text: string };
type ModalState =
  | { mode: "create" }
  | { mode: "edit"; record: RecordData }
  | null;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:text-slate-500";

function formatNumber(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default function ModuleWorkspace({
  moduleKey,
  initialRecords,
}: {
  moduleKey: string;
  initialRecords: RecordData[];
}) {
  const config = getModuleConfig(moduleKey);
  const router = useRouter();
  const [records, setRecords] = useState<RecordData[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<RecordData | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [banner]);

  const filtered = useMemo(() => {
    if (!config) return [];
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      config.fields
        .filter((field) => field.type !== "json")
        .some((field) =>
          displayValue(config, field.name, record)
            .toLowerCase()
            .includes(query),
        ),
    );
  }, [config, records, search]);

  const stats = useMemo(() => {
    if (!config) return [];
    if (moduleKey === "pendaftaran") {
      return [
        { label: "Total sasaran", value: records.length },
        {
          label: "Balita",
          value: records.filter((record) => record.kategoriBalita).length,
        },
        {
          label: "Lansia",
          value: records.filter((record) => record.kategoriLansia).length,
        },
        {
          label: "PTM / Remaja",
          value: records.filter(
            (record) => record.kategoriPtm || record.kategoriRemaja,
          ).length,
        },
      ];
    }

    const visitField = config.fields.find((field) =>
      ["tanggalKunjungan", "jadwalPosyandu", "tanggalUkur"].includes(
        field.name,
      ),
    );
    const now = new Date();
    const thisMonth = records.filter((record) => {
      if (!visitField) return false;
      const date = record[visitField.name];
      if (!date) return false;
      const parsed = new Date(String(date));
      return (
        parsed.getMonth() === now.getMonth() &&
        parsed.getFullYear() === now.getFullYear()
      );
    }).length;

    const rujuk = records.filter(
      (record) =>
        record.rujuk === "Ya" ||
        record.rujukPuma === "Rujuk" ||
        record.hasilTbc === "Rujuk Puskesmas" ||
        record.hasilSkilas === "Rujuk Puskesmas" ||
        record.hasilLila === "KEK (<23,5)" ||
        record.statusImt === "Obesitas",
    ).length;

    return [
      { label: "Total data", value: records.length },
      {
        label: "Nama unik",
        value: new Set(records.map((record) => record.nama).filter(Boolean))
          .size,
      },
      { label: "Bulan ini", value: thisMonth },
      { label: "Perlu perhatian", value: rujuk },
    ];
  }, [config, moduleKey, records]);

  if (!config) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Modul tidak ditemukan.
      </div>
    );
  }

  function handleSaved(record: RecordData, mode: "create" | "edit") {
    setRecords((current) =>
      mode === "create"
        ? [record, ...current]
        : current.map((item) => (item.id === record.id ? record : item)),
    );
    setModal(null);
    setBanner({
      type: "success",
      text:
        mode === "create"
          ? "Data berhasil ditambahkan."
          : "Data berhasil diperbarui.",
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = String(confirmDelete.id);
    setBusyId(id);
    try {
      const response = await fetch(`/api/posyandu/${moduleKey}/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) {
        setBanner({
          type: "error",
          text: data.message ?? "Gagal menghapus data.",
        });
        return;
      }
      setRecords((current) => current.filter((item) => item.id !== id));
      setBanner({ type: "success", text: "Data berhasil dihapus." });
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
            {config.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {config.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Data
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari data…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <p className="text-xs text-slate-500">
            Menampilkan {filtered.length} dari {records.length} data
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                {!config.tableColumns.includes("no") && (
                  <th className="w-12 px-4 py-3 font-semibold">No</th>
                )}
                {config.tableColumns.map((column) => (
                  <th key={column} className="whitespace-nowrap px-4 py-3 font-semibold">
                    {getField(config, column)?.label ?? column}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((record, rowIndex) => (
                <tr
                  key={String(record.id)}
                  className="transition hover:bg-slate-50/70"
                >
                  {!config.tableColumns.includes("no") && (
                    <td className="px-4 py-3 text-slate-400">{rowIndex + 1}</td>
                  )}
                  {config.tableColumns.map((column) => (
                    <td
                      key={column}
                      className={`whitespace-nowrap px-4 py-3 ${
                        column === "nama"
                          ? "font-medium text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {column === "no"
                        ? formatNumber(record[column])
                        : displayValue(config, column, record)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "edit", record })}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                        aria-label="Ubah data"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(record)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Hapus data"
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

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <p className="text-sm font-medium text-slate-600">
              {records.length === 0
                ? "Belum ada data"
                : "Tidak ada data yang cocok"}
            </p>
            <p className="text-xs text-slate-400">
              {records.length === 0
                ? "Klik “Tambah Data” untuk mencatat data pertama."
                : "Coba kata kunci lain."}
            </p>
          </div>
        )}
      </section>

      {modal && (
        <RecordFormModal
          config={config}
          moduleKey={moduleKey}
          record={modal.mode === "edit" ? modal.record : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus data?"
          description="Data yang dihapus tidak dapat dikembalikan."
          busy={busyId === String(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function initialValues(
  config: ModuleConfig,
  record?: RecordData,
): RecordData {
  const values: RecordData = { ...(config.defaultValues ?? {}) };
  for (const field of config.fields) {
    if (field.type === "attendance") {
      values[field.name] =
        record?.[field.name] &&
        typeof record[field.name] === "object"
          ? record[field.name]
          : {};
      continue;
    }
    if (field.type === "checkbox") {
      values[field.name] = Boolean(record?.[field.name]);
      continue;
    }
    if (field.type === "json") {
      values[field.name] = record?.[field.name] ?? {};
      continue;
    }
    if (field.type === "date") {
      values[field.name] = record?.[field.name]
        ? String(record[field.name]).slice(0, 10)
        : "";
      continue;
    }
    values[field.name] = record?.[field.name] ?? "";
  }
  return values;
}

function RecordFormModal({
  config,
  moduleKey,
  record,
  onClose,
  onSaved,
}: {
  config: ModuleConfig;
  moduleKey: string;
  record?: RecordData;
  onClose: () => void;
  onSaved: (record: RecordData, mode: "create" | "edit") => void;
}) {
  const mode = record ? "edit" : "create";
  const [values, setValues] = useState<RecordData>(() =>
    initialValues(config, record),
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

  const computed = config.compute({ ...values });
  const sections = useMemo(() => {
    const result: string[] = [];
    for (const field of config.fields) {
      if (field.hidden) continue;
      const section = field.section ?? "Data";
      if (!result.includes(section)) result.push(section);
    }
    return result;
  }, [config]);

  function setValue(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    for (const field of config.fields) {
      if (!field.required) continue;
      if (String(values[field.name] ?? "").trim() === "") {
        setError(`${field.label} wajib diisi.`);
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch(
        mode === "create"
          ? `/api/posyandu/${moduleKey}`
          : `/api/posyandu/${moduleKey}/${record?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        record?: RecordData;
      };

      if (!response.ok || !data.record) {
        setError(data.message ?? "Gagal menyimpan data.");
        setSaving(false);
        return;
      }

      onSaved(data.record, mode);
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
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "create" ? `Tambah ${config.shortTitle}` : `Ubah ${config.shortTitle}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Kolom bertanda * wajib diisi. Nilai abu-abu dihitung otomatis.
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

          {sections.map((section) => (
            <section key={section}>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                {section}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {config.fields
                  .filter(
                    (field) =>
                      !field.hidden && (field.section ?? "Data") === section,
                  )
                  .map((field) => (
                    <FieldInput
                      key={field.name}
                      field={field}
                      value={values[field.name]}
                      computedValue={computed[field.name]}
                      disabled={saving}
                      onChange={(value) => setValue(field.name, value)}
                    />
                  ))}
              </div>
            </section>
          ))}

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
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  computedValue,
  disabled,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  computedValue: unknown;
  disabled: boolean;
  onChange: (value: unknown) => void;
}) {
  const spanClass =
    field.span === 2 || field.span === 3 || field.span === 4
      ? "sm:col-span-2"
      : "";

  if (field.type === "computed") {
    return (
      <div className={spanClass}>
        <p className="mb-1 text-xs font-medium text-slate-500">{field.label}</p>
        <div className="min-h-[38px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          {computedValue === null ||
          computedValue === undefined ||
          computedValue === ""
            ? "—"
            : String(computedValue)}
        </div>
      </div>
    );
  }

  if (field.type === "attendance") {
    const attendance =
      value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
    return (
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs font-medium text-slate-500">
          {field.label}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {BULAN.map((month) => {
            const checked = Boolean(attendance[month]);
            return (
              <label
                key={month}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                  checked
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({ ...attendance, [month]: event.target.checked })
                  }
                  className="sr-only"
                />
                {checked ? "✓" : ""} {month}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label
        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
          value
            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
            : "border-slate-200 bg-white text-slate-600"
        } ${spanClass}`}
      >
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        {field.label}
      </label>
    );
  }

  return (
    <div className={spanClass}>
      <label
        htmlFor={`field-${field.name}`}
        className="mb-1 block text-xs font-medium text-slate-500"
      >
        {field.label}
        {field.required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={`field-${field.name}`}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={field.placeholder}
          rows={2}
          className={inputClass}
        />
      ) : field.type === "select" ? (
        <select
          id={`field-${field.name}`}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Pilih…</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={`field-${field.name}`}
          type={
            field.type === "date"
              ? "date"
              : field.type === "number"
                ? "number"
                : "text"
          }
          inputMode={field.type === "number" ? "decimal" : undefined}
          step={field.type === "number" ? (field.step ?? "any") : undefined}
          min={field.min}
          max={field.max}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}

      {field.help && (
        <p className="mt-1 text-[11px] text-slate-400">{field.help}</p>
      )}
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => !busy && onCancel()}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? "Menghapus…" : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
