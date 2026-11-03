import { NextRequest, NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();

  await destroySession();

  if (session) {
    try {
      await prisma.auditLog.create({
        data: {
          action: "LOGOUT",
          email: session.email,
          userId: session.id,
          ip:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "unknown",
          userAgent: request.headers.get("user-agent"),
        },
      });
    } catch (error) {
      console.error("Gagal menulis audit log logout:", error);
    }
  }

  return NextResponse.json({ ok: true });
}
