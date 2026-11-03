import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { BULAN } from "@/lib/posyandu/compute";
import { mergeLaporanData, sumGroup } from "@/lib/posyandu/laporan-bulanan";
import PosyanduTabs from "@/components/posyandu/PosyanduTabs";

export const metadata: Metadata = { title: "Rekap Kunjungan" };
export const dynamic = "force-dynamic";

function countTotalSasaran(data: unknown): number {
  const parsed = mergeLaporanData(data);
  const total = sumGroup(parsed.sasaran, Object.keys(parsed.sasaran));
  return total.l + total.p;
}

export default async function RekapPage() {
  await requireUser();

  const [
    total,
    balita,
    lansia,
    ptm,
    remaja,
    ibuHamil,
    remajaKunjungan,
    dewasa,
    lansiaKunjungan,
    kasus,
    reports,
    sasaran,
  ] = await Promise.all([
    prisma.sasaran.count(),
    prisma.sasaran.count({ where: { kategoriBalita: true } }),
    prisma.sasaran.count({ where: { kategoriLansia: true } }),
    prisma.sasaran.count({ where: { kategoriPtm: true } }),
    prisma.sasaran.count({ where: { kategoriRemaja: true } }),
    prisma.kunjunganIbuHamil.count(),
    prisma.kunjunganRemaja.count(),
    prisma.kunjunganDewasa.count(),
    prisma.kunjunganLansia.count(),
    prisma.laporanKasus.groupBy({
      by: ["kategori"],
      _count: { _all: true },
    }),
    prisma.laporanBulanan.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.sasaran.findMany({ select: { kehadiran: true } }),
  ]);

  const monthly = BULAN.map((month) => ({
    month,
    count: sasaran.filter((item) => {
      const attendance = item.kehadiran;
      return (
        attendance !== null &&
        typeof attendance === "object" &&
        !Array.isArray(attendance) &&
        Boolean((attendance as Record<string, unknown>)[month])
      );
    }).length,
  }));
  const maxMonthly = Math.max(1, ...monthly.map((item) => item.count));

  const kategoriCards = [
    { label: "Total sasaran terdaftar", value: total },
    { label: "Balita 0–59 bln", value: balita },
    { label: "Lansia", value: lansia },
    { label: "PTM", value: ptm },
    { label: "Remaja", value: remaja },
  ];

  const kunjunganCards = [
    { label: "Kartu Ibu Hamil", value: ibuHamil },
    { label: "Kartu Remaja", value: remajaKunjungan },
    { label: "Kartu Dewasa", value: dewasa },
    { label: "Kartu Lansia", value: lansiaKunjungan },
  ];

  return (
    <div className="space-y-5">
      <PosyanduTabs />

      <div className="space-y-6">
        <header>
          <p className="text-sm font-medium text-emerald-600">Posyandu</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Rekap Kunjungan
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Jumlah sasaran per kategori dan kehadiran per bulan, dihitung
            otomatis dari Buku Pendaftaran.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kategoriCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Kehadiran per Bulan
              </h2>
              <p className="text-xs text-slate-500">
                Jumlah tanda ✓ pada Buku Pendaftaran.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {monthly.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center gap-4 px-5 py-2.5"
                >
                  <span className="w-10 text-xs font-semibold text-slate-500">
                    {item.month}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${(item.count / maxMonthly) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-slate-700">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Kunjungan Kartu
                </h2>
                <p className="text-xs text-slate-500">
                  Jumlah baris kunjungan yang tercatat pada setiap kartu.
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {kunjunganCards.map((card) => (
                  <div
                    key={card.label}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="text-sm text-slate-600">{card.label}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {card.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Daftar Nama Laporan
                </h2>
                <p className="text-xs text-slate-500">
                  BGM, T2, bayi baru lahir, bumil KEK, dan bumil anemia.
                </p>
              </div>
              {kasus.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400">
                  Belum ada data.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {kasus.map((item) => (
                    <div
                      key={item.kategori}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <span className="text-sm text-slate-600">
                        {item.kategori}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {item._count._all}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Laporan Bulanan Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Ringkasan laporan hasil kegiatan yang sudah disimpan.
            </p>
          </div>
          {reports.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">
              Belum ada laporan bulanan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Bulan / Tahun</th>
                    <th className="px-5 py-3 font-semibold">Dusun</th>
                    <th className="px-5 py-3 font-semibold">Desa</th>
                    <th className="px-5 py-3 font-semibold">Total sasaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {report.bulanTahun ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {report.dusun ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {report.desa ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {countTotalSasaran(report.data)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
