import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { createUserSchema } from "@/lib/validation";

export async function GET() {
  const admin = await getApiUser();
  if (!admin) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }
  if (admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const admin = await getApiUser();
  if (!admin) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }
  if (admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Format permintaan tidak valid" },
      { status: 400 },
    );
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const { name, username, email, password, role } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        message:
          existing.username === username
            ? "Username sudah digunakan"
            : "Email sudah terdaftar",
      },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      passwordHash: await hashPassword(password),
      role,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
