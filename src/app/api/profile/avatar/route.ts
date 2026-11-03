import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth";
import {
  AVATAR_MAX_BYTES,
  avatarExtension,
  avatarUrl,
  deleteAvatar,
  uploadAvatar,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarKey: true },
  });

  return NextResponse.json({
    avatarKey: record?.avatarKey ?? null,
    avatarUrl: await avatarUrl(record?.avatarKey),
  });
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { message: "Format upload tidak valid" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "File avatar wajib dikirim" },
      { status: 400 },
    );
  }

  if (!avatarExtension(file.type)) {
    return NextResponse.json(
      { message: "Format gambar harus JPG, PNG, WEBP, atau GIF" },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { message: "File avatar kosong" },
      { status: 400 },
    );
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json(
      { message: "Ukuran avatar maksimal 2 MB" },
      { status: 400 },
    );
  }

  const previous = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarKey: true },
  });

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const key = await uploadAvatar(user.id, bytes, file.type);

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarKey: key },
    });

    // Hapus objek versi lama setelah baris database menunjuk ke key baru.
    await deleteAvatar(previous?.avatarKey);

    return NextResponse.json({
      avatarKey: key,
      avatarUrl: await avatarUrl(key),
    });
  } catch (error) {
    console.error("Gagal upload avatar:", error);
    return NextResponse.json(
      { message: "Gagal mengunggah avatar ke Neon Object Storage" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarKey: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarKey: null },
  });
  await deleteAvatar(record?.avatarKey);

  return NextResponse.json({ ok: true });
}
