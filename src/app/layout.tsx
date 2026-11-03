import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SiPosyandu — Posyandu Pede Seneng",
    template: "%s | SiPosyandu",
  },
  description:
    "Sistem Informasi Posyandu Pede Seneng, Desa Montong Betok, Kecamatan Montong Gading.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
