"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRow } from "@/lib/types";
import { ROLES, roleLabel } from "@/lib/roles";
import { formatDateTime } from "@/lib/format";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-amber-50 text-amber-700 ring-amber-200",
  KADER: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

type Banner = { type: "success" | "error"; text: string };

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; user: UserRow }
  | null;

export default function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [banner]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        roleLabel(user.role).toLowerCase().includes(query),
    );
  }, [users, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.isActive).length,
      admin: users.filter((user) => user.role === "ADMIN").length,
    }),
    [users],
  );

  function handleSaved(user: UserRow, mode: "create" | "edit") {
    setUsers((current) =>
      mode === "create"
        ? [...current, user]
        : current.map((item) => (item.id === user.id ? user : item)),
    );
    setModal(null);
    setBanner({
      type: "success",
      text:
        mode === "create"
          ? `Pengguna ${user.name} berhasil ditambahkan.`
          : `Data ${user.name} berhasil diperbarui.`,
    });
    router.refresh();
  }

  async function toggleActive(user: UserRow) {
    setBusyId(user.id);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        user?: UserRow;
      };

      if (!response.ok || !data.user) {
        setBanner({
          type: "error",
          text: data.message ?? "Gagal memperbarui status pengguna.",
        });
        return;
      }

      setUsers((current) =>
        current.map((item) => (item.id === data.user!.id ? data.user! : item)),
      );
      setBanner({
        type: "success",
        text: `Akun ${data.user.name} ${data.user.isActive ? "diaktifkan" : "dinonaktifkan"}.`,
      });
      router.refresh();
    } catch {
      setBanner({ type: "error", text: "Tidak dapat terhubung ke server." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    try {
      const response = await fetch(`/api/users/${confirmDelete.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setBanner({
          type: "error",
          text: data.message ?? "Gagal menghapus pengguna.",
        });
        setConfirmDelete(null);
        return;
      }

      setUsers((current) =>
        current.filter((item) => item.id !== confirmDelete.id),
      );
      setBanner({
        type: "success",
        text: `Pengguna ${confirmDelete.name} berhasil dihapus.`,
      });
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Manajemen Pengguna
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola akun admin dan kader yang dapat mengakses sistem.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Pengguna
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total pengguna" value={stats.total} />
        <SummaryCard label="Akun aktif" value={stats.active} />
        <SummaryCard label="Administrator" value={stats.admin} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, username, email, atau peran…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <p className="text-xs text-slate-500">
            Menampilkan {filtered.length} dari {users.length} pengguna
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Pengguna</th>
                <th className="px-5 py-3 font-semibold">Peran</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Login terakhir</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {user.name
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part.charAt(0).toUpperCase())
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {user.name}
                            {isSelf && (
                              <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            @{user.username} · {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          ROLE_BADGE[user.role] ??
                          "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        disabled={isSelf || busyId === user.id}
                        title={
                          isSelf
                            ? "Tidak dapat menonaktifkan akun sendiri"
                            : "Klik untuk mengubah status"
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {user.lastLoginAt
                        ? formatDateTime(user.lastLoginAt)
                        : "Belum pernah"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setModal({ mode: "edit", user })}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                          aria-label={`Ubah ${user.name}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(user)}
                          disabled={isSelf}
                          title={
                            isSelf ? "Tidak dapat menghapus akun sendiri" : undefined
                          }
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                          aria-label={`Hapus ${user.name}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <UsersIcon className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              {users.length === 0
                ? "Belum ada pengguna"
                : "Tidak ada pengguna yang cocok"}
            </p>
            <p className="text-xs text-slate-400">
              {users.length === 0
                ? "Tambahkan pengguna pertama untuk mulai menggunakan sistem."
                : "Coba kata kunci lain atau ubah filter pencarian."}
            </p>
          </div>
        )}
      </section>

      {modal && (
        <UserFormModal
          mode={modal.mode}
          user={modal.mode === "edit" ? modal.user : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus pengguna?"
          description={`Akun ${confirmDelete.name} (@${confirmDelete.username}) akan dihapus permanen dan tidak dapat masuk lagi ke sistem.`}
          busy={busyId === confirmDelete.id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function UserFormModal({
  mode,
  user,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  user?: UserRow;
  onClose: () => void;
  onSaved: (user: UserRow, mode: "create" | "edit") => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "KADER");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(username.trim())) {
      setError(
        "Username 3–30 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip.",
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }
    if (mode === "create" && password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (mode === "edit" && password.length > 0 && password.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        role,
      };
      if (password) payload.password = password;
      if (mode === "edit") payload.isActive = isActive;

      const response = await fetch(
        mode === "create" ? "/api/users" : `/api/users/${user?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        user?: UserRow;
      };

      if (!response.ok || !data.user) {
        setError(data.message ?? "Gagal menyimpan pengguna.");
        setSaving(false);
        return;
      }

      onSaved(data.user, mode);
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
        aria-labelledby="user-modal-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2
              id="user-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              {mode === "create" ? "Tambah pengguna" : "Ubah pengguna"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {mode === "create"
                ? "Buat akun baru dengan peran yang sesuai."
                : "Perbarui data akun, peran, atau password."}
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

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Field label="Nama lengkap" htmlFor="user-name">
            <input
              id="user-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Siti Aminah"
              className={inputClass}
              disabled={saving}
              required
            />
          </Field>

          <Field label="Username" htmlFor="user-username" hint="Dipakai untuk login. 3–30 karakter: huruf kecil, angka, titik, garis bawah, atau strip.">
            <input
              id="user-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Contoh: siti.aminah"
              className={inputClass}
              disabled={saving}
              autoComplete="off"
              required
            />
          </Field>

          <Field label="Email" htmlFor="user-email">
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@siposyandu.id"
              className={inputClass}
              disabled={saving}
              required
            />
          </Field>

          <Field label="Peran" htmlFor="user-role">
            <select
              id="user-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={inputClass}
              disabled={saving}
            >
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {roleLabel(value)}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={mode === "create" ? "Password" : "Password baru (opsional)"}
            htmlFor="user-password"
            hint={
              mode === "create"
                ? "Minimal 8 karakter."
                : "Kosongkan jika tidak ingin mengubah password."
            }
          >
            <input
              id="user-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "create" ? "Minimal 8 karakter" : "••••••••"}
              className={inputClass}
              disabled={saving}
              autoComplete="new-password"
              required={mode === "create"}
            />
          </Field>

          {mode === "edit" && (
            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-slate-800">
                  Akun aktif
                </span>
                <span className="block text-xs text-slate-500">
                  Akun nonaktif tidak dapat masuk ke sistem.
                </span>
              </span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                disabled={saving}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 accent-emerald-600"
              />
            </label>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {saving
                ? "Menyimpan…"
                : mode === "create"
                  ? "Simpan pengguna"
                  : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
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
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <TrashIcon className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {busy ? "Menghapus…" : "Ya, hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50";
