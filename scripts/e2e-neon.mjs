import { PrismaClient } from "@prisma/client";
import { createRealtime, rawSql } from "@neon/realtime/server";
import { createRealtimeClient } from "@neon/realtime/client";
import WebSocket from "ws";

const BASE = "http://127.0.0.1:3100";
const prisma = new PrismaClient();

let pass = 0;
let fail = 0;

function check(name, ok, extra = "") {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}${extra ? ` — ${extra}` : ""}`);
  } else {
    fail++;
    console.log(`FAIL  ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${BASE}/login`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server tidak siap");
}

function cookieFrom(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.length ? raw[0].split(";")[0] : null;
}

async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return { res, cookie: cookieFrom(res) };
}

await waitReady();
console.log("=== 1. Postgres + custom auth (login) ===");

const admin = await login("admin", "Admin123!");
check("Login admin = 200", admin.res.status === 200, `status ${admin.res.status}`);
check("Cookie sesi diterbitkan", Boolean(admin.cookie));

const users = await prisma.user.count();
check("Data user tersimpan di Neon Postgres", users === 2, `${users} user`);

const noAuthStatus = await fetch(`${BASE}/api/neon/status`);
check(
  "Status API tanpa login = 401",
  noAuthStatus.status === 401,
  `status ${noAuthStatus.status}`,
);

console.log("\n=== 2. /api/neon/status (5 layanan) ===");
const statusRes = await fetch(`${BASE}/api/neon/status`, {
  headers: { cookie: admin.cookie },
});
const statusBody = await statusRes.json();
check("Status API admin = 200", statusRes.status === 200, `status ${statusRes.status}`);
for (const [name, service] of Object.entries(statusBody.services ?? {})) {
  check(
    `${name} terhubung`,
    service.ok === true,
    `${service.latencyMs}ms · ${service.detail}`,
  );
}

console.log("\n=== 3. Neon Auth (JWKS) ===");
const jwks = await fetch(process.env.NEON_AUTH_JWKS_URL);
const jwksBody = await jwks.json();
check(
  "JWKS Neon Auth dapat dibaca",
  jwks.ok && Array.isArray(jwksBody.keys) && jwksBody.keys.length > 0,
  `${jwksBody.keys?.length ?? 0} key`,
);

console.log("\n=== 4. Neon Functions ===");
const fnBase = process.env.NEON_FUNCTION_HELLO_BASE_URL;
const fnNoSecret = await fetch(fnBase);
check(
  "Function menolak tanpa x-internal-secret = 401",
  fnNoSecret.status === 401,
  `status ${fnNoSecret.status}`,
);

const fnWithSecret = await fetch(fnBase, {
  headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET },
});
const fnBody = await fnWithSecret.json();
check(
  "Function query Postgres = 200",
  fnWithSecret.ok && fnBody.ok === true,
  `database ${fnBody.database}, branch ${fnBody.branch}`,
);

console.log("\n=== 5. Neon Object Storage (avatar) ===");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);
const form = new FormData();
form.append("file", new Blob([png], { type: "image/png" }), "avatar.png");

const uploadRes = await fetch(`${BASE}/api/profile/avatar`, {
  method: "POST",
  headers: { cookie: admin.cookie },
  body: form,
});
const uploadBody = await uploadRes.json();
check(
  "Upload avatar = 200",
  uploadRes.status === 200,
  `status ${uploadRes.status}${uploadBody.message ? ` · ${uploadBody.message}` : ""}`,
);
check(
  "Avatar key tersimpan (avatars/...)",
  typeof uploadBody.avatarKey === "string" &&
    uploadBody.avatarKey.startsWith("avatars/"),
  uploadBody.avatarKey,
);

const presigned = await fetch(uploadBody.avatarUrl);
const downloaded = Buffer.from(await presigned.arrayBuffer());
check(
  "Presigned URL avatar dapat diunduh",
  presigned.ok && downloaded.length === png.length,
  `status ${presigned.status}, ${downloaded.length} byte`,
);

const dbAvatar = await prisma.user.findUnique({
  where: { email: "admin@siposyandu.id" },
  select: { avatarKey: true },
});
check(
  "User.avatarKey menunjuk objek yang sama",
  dbAvatar?.avatarKey === uploadBody.avatarKey,
  dbAvatar?.avatarKey,
);

console.log("\n=== 6. Neon Realtime (sealed query + live insert) ===");
const sealedRes = await fetch(`${BASE}/api/realtime/activity`, {
  method: "POST",
  headers: { cookie: admin.cookie },
});
const sealed = await sealedRes.json();
check(
  "API mengeluarkan sealed query = 200",
  sealedRes.status === 200 && typeof sealed.capability === "string",
  `fingerprint ${String(sealed.queryFingerprint).slice(0, 12)}…`,
);

const rt = createRealtime({
  url: process.env.NEON_REALTIME_URL,
  secret: process.env.NEON_REALTIME_SECRET,
  db: "neondb",
});

const sub = await rt.subscribe(
  rawSql(
    `SELECT id, action, detail, "createdAt" AS created_at FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 20`,
  ),
);

await sub.awaitRows(() => true, 15000);
const initialRows = sub.getSnapshot().data ?? [];
check(
  "Langganan Realtime menerima snapshot awal",
  initialRows.length > 0,
  `${initialRows.length} baris`,
);

const marker = `e2e-realtime-${Date.now()}`;
await prisma.auditLog.create({
  data: {
    action: "LOGIN_SUCCESS",
    email: "e2e@test.local",
    detail: marker,
  },
});

let liveOk = false;
try {
  await sub.awaitRows(
    (rows) => rows.some((row) => row.detail === marker),
    15000,
  );
  liveOk = true;
} catch (error) {
  liveOk = false;
  console.log(`      realtime error: ${error.message}`);
}

check("Baris baru masuk lewat WebSocket Realtime", liveOk);

sub.unsubscribe();
rt.close();

// Simulasikan jalur browser: sealed query + RealtimeClient + WebSocket.
const browserClient = createRealtimeClient({
  url: process.env.NEON_REALTIME_URL,
  webSocketFactory: (url, protocols) =>
    new WebSocket(url, protocols, { origin: "http://localhost:3100" }),
});

const browserSub = browserClient.subscribe(sealed);
await browserSub.awaitRows(() => true, 15000);

const marker2 = `e2e-sealed-${Date.now()}`;
await prisma.auditLog.create({
  data: {
    action: "LOGIN_SUCCESS",
    email: "e2e@test.local",
    detail: marker2,
  },
});

let sealedOk = false;
try {
  await browserSub.awaitRows(
    (rows) => rows.some((row) => row.detail === marker2),
    15000,
  );
  sealedOk = true;
} catch (error) {
  sealedOk = false;
  console.log(`      sealed realtime error: ${error.message}`);
}

check(
  "Sealed query dari API dipakai browser client (origin diizinkan)",
  sealedOk,
);

browserSub.unsubscribe();
browserClient.close();

await prisma.auditLog.deleteMany({
  where: { detail: { in: [marker, marker2] } },
});

console.log("\n=== 7. Kader scope ===");
const kader = await login("kader", "Kader123!");
check("Login kader = 200", kader.res.status === 200, `status ${kader.res.status}`);

const kaderStatus = await fetch(`${BASE}/api/neon/status`, {
  headers: { cookie: kader.cookie },
});
check(
  "Status API untuk kader = 403",
  kaderStatus.status === 403,
  `status ${kaderStatus.status}`,
);

const kaderSealed = await fetch(`${BASE}/api/realtime/activity`, {
  method: "POST",
  headers: { cookie: kader.cookie },
});
const kaderSealedBody = await kaderSealed.json();
check(
  "Kader tetap mendapat sealed query sendiri = 200",
  kaderSealed.status === 200 && typeof kaderSealedBody.capability === "string",
  `status ${kaderSealed.status}`,
);

await prisma.$disconnect();

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
