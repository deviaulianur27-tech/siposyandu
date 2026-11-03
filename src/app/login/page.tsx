import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import { HeartPulseIcon, ShieldIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Masuk" };

const FEATURES = [
  {
    icon: UsersIcon,
    title: "Data sasaran terpadu",
    description: "Balita, remaja, ibu hamil, dewasa, dan lansia dalam satu tempat.",
  },
  {
    icon: HeartPulseIcon,
    title: "Pemeriksaan terstruktur",
    description: "Kartu bantu pemeriksaan dengan perhitungan otomatis.",
  },
  {
    icon: ShieldIcon,
    title: "Akses sesuai peran",
    description: "Admin dan kader punya hak akses yang berbeda.",
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Panel branding */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25) 0, transparent 40%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-white/10"
        />

        <div className="relative">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-700">
              <HeartPulseIcon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold tracking-wide text-white">
              SiPosyandu
            </span>
          </div>

          <h2 className="mt-12 max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
            Sistem Informasi Posyandu Pede Seneng
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-emerald-50/90">
            Satu pintu untuk pencatatan sasaran, pemeriksaan, dan laporan
            bulanan Posyandu di Desa Montong Betok.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
                  <feature.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-sm text-emerald-50/75">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-emerald-50/60">
          Kecamatan Montong Gading · Kabupaten Lombok Timur
        </p>
      </section>

      {/* Panel form */}
      <section className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <HeartPulseIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">SiPosyandu</p>
              <p className="text-xs text-slate-500">Posyandu Pede Seneng</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Posyandu Pede Seneng. Semua hak dilindungi.
          </p>
        </div>
      </section>
    </main>
  );
}
