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

type RouteContext = { params: Promise<{ module: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  const { module } = await context.params;
  const resolved = resolveModule(module);
  if (!resolved) {
    return NextResponse.json({ message: "Modul tidak dikenal" }, { status: 404 });
  }

  const records = await resolved.delegate.findMany({
    orderBy: resolved.config.orderBy,
  });

  return NextResponse.json({ records: records.map(serializeRecord) });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  const { module } = await context.params;
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
  const record = await resolved.delegate.create({ data });
  const label = data.nama ?? data.bulanTahun ?? "data baru";

  await logPosyandu(
    user,
    "POSYANDU_CREATE",
    `Menambah ${resolved.config.title}: ${String(label)}`,
  );

  return NextResponse.json(
    { record: serializeRecord(record) },
    { status: 201 },
  );
}
