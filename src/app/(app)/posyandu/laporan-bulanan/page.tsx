import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeRecord } from "@/lib/posyandu/server";
import LaporanBulananWorkspace from "@/components/posyandu/LaporanBulananWorkspace";
import PosyanduTabs from "@/components/posyandu/PosyanduTabs";

export const metadata: Metadata = { title: "Laporan Bulanan" };
export const dynamic = "force-dynamic";

export default async function LaporanBulananPage() {
  await requireUser();

  const reports = await prisma.laporanBulanan.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <PosyanduTabs />
      <LaporanBulananWorkspace
        initialReports={reports.map((report) =>
          serializeRecord(report as unknown as Record<string, unknown>),
        )}
      />
    </div>
  );
}
