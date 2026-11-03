import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getModuleConfig } from "@/lib/posyandu/modules";
import { resolveModule, serializeRecord } from "@/lib/posyandu/server";
import ModuleWorkspace from "@/components/posyandu/ModuleWorkspace";
import PosyanduTabs from "@/components/posyandu/PosyanduTabs";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ module: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { module } = await params;
  const config = getModuleConfig(module);
  return { title: config?.shortTitle ?? "Posyandu" };
}

export default async function PosyanduModulePage({ params }: PageProps) {
  await requireUser();

  const { module } = await params;
  const resolved = resolveModule(module);
  if (!resolved) notFound();

  const records = await resolved.delegate.findMany({
    orderBy: resolved.config.orderBy,
  });

  return (
    <div className="space-y-5">
      <PosyanduTabs />
      <ModuleWorkspace
        moduleKey={module}
        initialRecords={records.map(serializeRecord)}
      />
    </div>
  );
}
