import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { isRole } from "@/lib/roles";

// Hash dummy agar waktu respons tetap mirip saat email tidak ditemukan
// (mengurangi risiko user enumeration lewat timing attack).
const DUMMY_HASH = bcrypt.hashSync("dummy-password-posyandu", 10);

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Format permintaan tidak valid" },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const rateKey = `${ip}:${username}`;

  const limit = checkRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        message: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(
          limit.retryAfterSeconds / 60,
        )} menit.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    await verifyPassword(password, DUMMY_HASH);
    await writeAudit({
      action: "LOGIN_FAILED",
      ip,
      userAgent: request.headers.get("user-agent"),
      detail: `Username tidak terdaftar: ${username}`,
    });
    return NextResponse.json(
      { message: "Username atau password salah" },
      { status: 401 },
    );
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    await writeAudit({
      action: "LOGIN_FAILED",
      email: user.email,
      userId: user.id,
      ip,
      userAgent: request.headers.get("user-agent"),
      detail: "Password salah",
    });
    return NextResponse.json(
      { message: "Username atau password salah" },
      { status: 401 },
    );
  }

  if (!user.isActive) {
    await writeAudit({
      action: "LOGIN_BLOCKED",
      email: user.email,
      userId: user.id,
      ip,
      userAgent: request.headers.get("user-agent"),
      detail: "Akun dinonaktifkan",
    });
    return NextResponse.json(
      { message: "Akun Anda dinonaktifkan. Hubungi administrator." },
      { status: 403 },
    );
  }

  if (!isRole(user.role)) {
    return NextResponse.json(
      { message: "Role akun tidak valid. Hubungi administrator." },
      { status: 403 },
    );
  }

  await createSession({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  });

  resetRateLimit(rateKey);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await writeAudit({
    action: "LOGIN_SUCCESS",
    email: user.email,
    userId: user.id,
    ip,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
}

async function writeAudit(data: {
  action: string;
  email?: string;
  userId?: string;
  ip: string;
  userAgent: string | null;
  detail?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        email: data.email,
        userId: data.userId,
        ip: data.ip,
        userAgent: data.userAgent,
        detail: data.detail,
      },
    });
  } catch (error) {
    // Audit log tidak boleh menggagalkan proses login.
    console.error("Gagal menulis audit log:", error);
  }
}
