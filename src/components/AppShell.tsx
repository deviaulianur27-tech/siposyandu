"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";
import RealtimeRoot from "@/components/RealtimeRoot";
import {
  BabyIcon,
  ChartIcon,
  ClipboardIcon,
  CloseIcon,
  DashboardIcon,
  FileTextIcon,
  HeartPulseIcon,
  LogoutIcon,
  MenuIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  adminOnly?: boolean;
};

type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Menu utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
      {
        href: "/pengguna",
        label: "Manajemen Pengguna",
        icon: UsersIcon,
        adminOnly: true,
      },
    ],
  },
  {
    title: "Posyandu",
    items: [
      {
        href: "/posyandu/pendaftaran",
        label: "Buku Pendaftaran",
        icon: ClipboardIcon,
      },
      {
        href: "/posyandu/ibu-hamil",
        label: "Kartu Ibu Hamil",
        icon: BabyIcon,
      },
      { href: "/posyandu/remaja", label: "Kartu Remaja", icon: UserIcon },
      { href: "/posyandu/dewasa", label: "Kartu Dewasa", icon: UsersIcon },
      {
        href: "/posyandu/lansia",
        label: "Kartu Lansia",
        icon: HeartPulseIcon,
      },
      {
        href: "/posyandu/laporan-nama",
        label: "Daftar Nama Laporan",
        icon: FileTextIcon,
      },
      {
        href: "/posyandu/laporan-bulanan",
        label: "Laporan Bulanan",
        icon: FileTextIcon,
      },
      {
        href: "/posyandu/rekap",
        label: "Rekap Kunjungan",
        icon: ChartIcon,
      },
    ],
  },
];

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-amber-400/15 text-amber-200 ring-amber-300/30",
  KADER: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30",
};

export default function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.adminOnly || user.role === "ADMIN",
    ),
  })).filter((group) => group.items.length > 0);
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
          <HeartPulseIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold tracking-wide text-white">SiPosyandu</p>
          <p className="text-xs text-slate-400">Pede Seneng</p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Tutup menu"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </p>
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            {initials || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <span
          className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
            ROLE_STYLE[user.role] ?? "bg-slate-700 text-slate-200 ring-slate-600"
          }`}
        >
          {roleLabel(user.role)}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-60"
        >
          <LogoutIcon className="h-4 w-4" />
          {loggingOut ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </div>
  );

  return (
    <RealtimeRoot>
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-72 shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Buka menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <HeartPulseIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-slate-900">SiPosyandu</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
    </RealtimeRoot>
  );
}
