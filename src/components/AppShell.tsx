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
    <div className="flex h-full flex-col bg-[#0b1c22] text-slate-300">
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-[#092027] shadow-lg shadow-emerald-500/20 ring-1 ring-white/15">
          <HeartPulseIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold tracking-wide text-white">SiPosyandu</p>
          <p className="text-xs text-emerald-100/55">Pede Seneng · Montong Betok</p>
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
            <p className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/35">
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
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-300/10 text-emerald-200 ring-1 ring-inset ring-emerald-200/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${active ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-300"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300/30 to-amber-200/20 text-sm font-semibold text-emerald-50 ring-1 ring-white/10">
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
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-60"
        >
          <LogoutIcon className="h-4 w-4" />
          {loggingOut ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </div>
  );

  return (
    <RealtimeRoot>
    <div className="app-surface min-h-screen lg:flex">
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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/70 bg-white/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-expanded={sidebarOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
            aria-label="Buka menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#163c3b] to-[#0b2228] text-emerald-200 shadow-md shadow-emerald-950/15">
              <HeartPulseIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-slate-900">SiPosyandu</p>
              <p className="truncate text-[10px] font-medium text-slate-500">Pede Seneng · Montong Betok</p>
            </div>
          </div>
          <span className="ml-auto hidden h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.35)] min-[360px]:block" aria-label="Sistem aktif" />
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 sm:pb-24 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Navigasi cepat"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200/80 bg-white/95 px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.35rem)] shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
      >
        {[
          { href: "/dashboard", label: "Beranda", icon: DashboardIcon },
          { href: "/posyandu/pendaftaran", label: "Data", icon: ClipboardIcon },
          { href: "/posyandu/laporan-bulanan", label: "Laporan", icon: FileTextIcon },
          { href: "/posyandu/rekap", label: "Rekap", icon: ChartIcon },
        ].map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition ${
                active ? "text-emerald-800" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={`flex h-7 w-9 items-center justify-center rounded-full ${
                active ? "bg-emerald-100 text-emerald-800" : ""
              }`}>
                <item.icon className="h-[18px] w-[18px]" />
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-expanded={sidebarOpen}
          aria-label="Buka semua menu"
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <span className="flex h-7 w-9 items-center justify-center">
            <MenuIcon className="h-[18px] w-[18px]" />
          </span>
          Menu
        </button>
      </nav>
    </div>
    </RealtimeRoot>
  );
}
