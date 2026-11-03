import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";
import { formatDateTime, greeting } from "@/lib/format";
import { activityQueryFor, realtime, type ActivityRow } from "@/lib/realtime";
import { avatarUrl } from "@/lib/storage";
import AvatarUploader from "@/components/AvatarUploader";
import LiveActivityFeed from "@/components/LiveActivityFeed";
import NeonStatusCard from "@/components/NeonStatusCard";
import {
  CheckIcon,
  ClockIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const [
    totalUsers,
    activeUsers,
    adminCount,
    kaderCount,
    logs,
    profile,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "ADMIN", isActive: true } }),
    prisma.user.count({ where: { role: "KADER", isActive: true } }),
    prisma.auditLog.findMany({
      where: user.role === "ADMIN" ? {} : { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarKey: true },
    }),
  ]);

  // Capability untuk langganan live + data awal dengan bentuk yang sama.
  const [sealedActivity, avatar] = await Promise.all([
    realtime.seal({ query: activityQueryFor(user) }),
    avatarUrl(profile?.avatarKey),
  ]);

  const initialActivity: ActivityRow[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    detail: log.detail,
    email: log.email,
    created_at: log.createdAt,
    user_name: log.user?.name ?? null,
  }));

  const stats = [
    { label: "Total pengguna", value: totalUsers, icon: UsersIcon, tone: "emerald" },
    { label: "Akun aktif", value: activeUsers, icon: CheckIcon, tone: "sky" },
    { label: "Admin", value: adminCount, icon: ShieldIcon, tone: "amber" },
    { label: "Kader", value: kaderCount, icon: ClockIcon, tone: "violet" },
  ];

  const toneClass: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            {greeting()}, {user.name.split(" ")[0]} 👋
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan sistem informasi Posyandu Pede Seneng.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {formatDateTime(new Date())}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${toneClass[stat.tone]}`}
              >
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LiveActivityFeed
          sealedQuery={sealedActivity}
          initialData={initialActivity}
          isAdmin={user.role === "ADMIN"}
        />

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Akun Anda</h2>

            <AvatarUploader initialUrl={avatar} name={user.name} />

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="truncate font-medium text-slate-800">
                  {user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Peran</dt>
                <dd className="font-medium text-slate-800">
                  {roleLabel(user.role)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </dd>
              </div>
            </dl>
          </section>

          <NeonStatusCard />

          <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <h2 className="text-sm font-semibold text-emerald-900">
              Hak akses Anda
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800/80">
              {user.role === "ADMIN"
                ? "Anda dapat mengelola seluruh pengguna, peran, dan status akun pada menu Manajemen Pengguna."
                : "Anda dapat melihat dashboard dan mencatat data posyandu. Pengelolaan akun hanya dapat dilakukan administrator."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
