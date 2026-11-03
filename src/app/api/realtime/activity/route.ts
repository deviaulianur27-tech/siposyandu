import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { activityQueryFor, getRealtime } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mengeluarkan sealed query baru untuk langganan Realtime di browser.
 * Parameter (userId) diambil dari sesi, bukan dari body request.
 */
export async function POST() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  try {
    const sealed = await getRealtime().seal({ query: activityQueryFor(user) });
    return NextResponse.json(sealed, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Gagal membuat sealed query:", error);
    return NextResponse.json(
      { message: "Gagal menyiapkan live query" },
      { status: 500 },
    );
  }
}
