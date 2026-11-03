import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { updateUserSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

const publicSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await getApiUser();
  if (!admin) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }
  if (admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Format permintaan tidak valid" },
      { status: 400 },
    );
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json(
      { message: "Pengguna tidak ditemukan" },
      { status: 404 },
    );
  }

  const { name, username, email, password, role, isActive } = parsed.data;

  if (target.id === admin.id && isActive === false) {
    return NextResponse.json(
      { message: "Anda tidak dapat menonaktifkan akun sendiri" },
      { status: 400 },
    );
  }

  const losingAdmin =
    target.role === "ADMIN" &&
    ((role !== undefined && role !== "ADMIN") || isActive === false);

  if (losingAdmin) {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });
    if (activeAdmins <= 1) {
      return NextResponse.json(
        {
          message:
            "Tidak dapat menghapus admin terakhir. Tambahkan admin lain terlebih dahulu.",
        },
        { status: 400 },
      );
    }
  }

  if (username && username !== target.username) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { message: "Username sudah digunakan" },
        { status: 409 },
      );
    }
  }

  if (email && email !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 409 },
      );
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(username !== undefined ? { username } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
    select: publicSelect,
  });

  return NextResponse.json({ user });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = await getApiUser();
  if (!admin) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }
  if (admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await context.params;

  if (id === admin.id) {
    return NextResponse.json(
      { message: "Anda tidak dapat menghapus akun sendiri" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json(
      { message: "Pengguna tidak ditemukan" },
      { status: 404 },
    );
  }

  if (target.role === "ADMIN" && target.isActive) {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });
    if (activeAdmins <= 1) {
      return NextResponse.json(
        { message: "Tidak dapat menghapus admin terakhir" },
        { status: 400 },
      );
    }
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
