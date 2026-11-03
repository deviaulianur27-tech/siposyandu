import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import {
  coerceInput,
  logPosyandu,
  resolveModule,
  serializeRecord,
  validateRequired,
} from "@/lib/posyandu/server";
import type { RecordData } from "@/lib/posyandu/compute";

type RouteContext = { params: Promise<{ module: string; id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  const { module, id } = await context.params;
  const resolved = resolveModule(module);
  if (!resolved) {
    return NextResponse.json({ message: "Modul tidak dikenal" }, { status: 404 });
  }

  let body: RecordData;
  try {
    body = (await request.json()) as RecordData;
  } catch {
    return NextResponse.json(
      { message: "Format permintaan tidak valid" },
      { status: 400 },
    );
  }

  const requiredError = validateRequired(resolved.config, body);
  if (requiredError) {
    return NextResponse.json({ message: requiredError }, { status: 400 });
  }

  const data = coerceInput(resolved.config, body);

  try {
    const record = await resolved.delegate.update({
      where: { id },
      data,
    });
    const label = data.nama ?? data.bulanTahun ?? id;

    await logPosyandu(
      user,
      "POSYANDU_UPDATE",
      `Memperbarui ${resolved.config.title}: ${String(label)}`,
    );

    return NextResponse.json({ record: serializeRecord(record) });
  } catch {
    return NextResponse.json(
      { message: "Data tidak ditemukan atau gagal diperbarui" },
      { status: 404 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  const { module, id } = await context.params;
  const resolved = resolveModule(module);
  if (!resolved) {
    return NextResponse.json({ message: "Modul tidak dikenal" }, { status: 404 });
  }

  try {
    const record = await resolved.delegate.delete({ where: { id } });
    await logPosyandu(
      user,
      "POSYANDU_DELETE",
      `Menghapus ${resolved.config.title}: ${String(record.nama ?? record.bulanTahun ?? id)}`,
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "Data tidak ditemukan atau gagal dihapus" },
      { status: 404 },
    );
  }
}
