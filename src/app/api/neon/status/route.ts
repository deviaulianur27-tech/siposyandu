import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth";
import { allActivityQuery, realtime } from "@/lib/realtime";
import { storageHealth } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ServiceCheck = {
  ok: boolean;
  latencyMs: number;
  detail: string;
};

async function check(fn: () => Promise<string>): Promise<ServiceCheck> {
  const startedAt = Date.now();
  try {
    const detail = await fn();
    return { ok: true, latencyMs: Date.now() - startedAt, detail };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : "Gagal memeriksa layanan",
    };
  }
}

async function checkPostgres(): Promise<string> {
  const rows = await prisma.$queryRaw<{ version: string }[]>`
    SELECT version() AS version
  `;
  const users = await prisma.user.count();
  const version = rows[0]?.version ?? "PostgreSQL";
  return `${version.split(" on ")[0]} · ${users} pengguna`;
}

async function checkAuth(): Promise<string> {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) throw new Error("NEON_AUTH_JWKS_URL belum diatur");

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`JWKS merespons ${response.status}`);
  }

  const payload = (await response.json()) as { keys?: unknown[] };
  const keys = Array.isArray(payload.keys) ? payload.keys.length : 0;
  if (keys === 0) throw new Error("JWKS tidak berisi public key");

  return `Neon Auth aktif · ${keys} JWKS key`;
}

async function checkStorage(): Promise<string> {
  const health = await storageHealth();
  return `Bucket ${health.bucket} · ${health.region ?? "-"} · ${health.sampleObjects} objek avatar`;
}

async function checkFunctions(): Promise<string> {
  const baseUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL;
  const secret = process.env.INTERNAL_API_SECRET;
  if (!baseUrl) throw new Error("NEON_FUNCTION_HELLO_BASE_URL belum diatur");
  if (!secret) throw new Error("INTERNAL_API_SECRET belum diatur");

  const response = await fetch(baseUrl, {
    headers: { "x-internal-secret": secret },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Function merespons ${response.status}`);
  }

  const payload = (await response.json()) as {
    ok?: boolean;
    database?: string;
    branch?: string;
  };
  if (!payload.ok) throw new Error("Function melaporkan status gagal");

  return `hello() ok · database ${payload.database ?? "-"} · branch ${payload.branch ?? "-"}`;
}

async function checkRealtime(): Promise<string> {
  if (!process.env.NEON_REALTIME_SECRET) {
    throw new Error("NEON_REALTIME_SECRET belum diatur");
  }
  if (!process.env.NEXT_PUBLIC_NEON_REALTIME_URL) {
    throw new Error("NEXT_PUBLIC_NEON_REALTIME_URL belum diatur");
  }

  const sealed = await realtime.seal({ query: allActivityQuery() });
  return `Sealed query dibuat · fingerprint ${sealed.queryFingerprint.slice(0, 12)}…`;
}

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const [postgres, auth, objectStorage, functions, realtimeCheck] =
    await Promise.all([
      check(checkPostgres),
      check(checkAuth),
      check(checkStorage),
      check(checkFunctions),
      check(checkRealtime),
    ]);

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      branch: process.env.NEON_BRANCH ?? null,
      services: {
        postgres,
        auth,
        objectStorage,
        functions,
        realtime: realtimeCheck,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
