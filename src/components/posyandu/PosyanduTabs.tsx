"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/posyandu/pendaftaran", label: "Pendaftaran" },
  { href: "/posyandu/ibu-hamil", label: "Ibu Hamil" },
  { href: "/posyandu/remaja", label: "Remaja" },
  { href: "/posyandu/dewasa", label: "Dewasa" },
  { href: "/posyandu/lansia", label: "Lansia" },
  { href: "/posyandu/laporan-nama", label: "Daftar Nama" },
  { href: "/posyandu/laporan-bulanan", label: "Laporan Bulanan" },
  { href: "/posyandu/rekap", label: "Rekap" },
];

export default function PosyanduTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
