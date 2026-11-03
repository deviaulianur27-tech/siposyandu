import { createRealtime, rawSql } from "@neon/realtime/server";

let realtime: ReturnType<typeof createRealtime> | undefined;

/**
 * Inisialisasi saat Realtime benar-benar dipakai, bukan saat Next.js memuat
 * modul untuk mengumpulkan konfigurasi route ketika build.
 */
export function getRealtime() {
  const secret = process.env.NEON_REALTIME_SECRET;
  if (!secret) throw new Error("NEON_REALTIME_SECRET belum diatur");

  realtime ??= createRealtime({
    secret,
    db: process.env.NEON_DATABASE_NAME ?? "neondb",
  });
  return realtime;
}

/** Bentuk baris yang dipakai baik oleh initial data Prisma maupun live query. */
export type ActivityRow = {
  id: string;
  action: string;
  detail: string | null;
  email: string | null;
  created_at: Date;
  user_name: string | null;
};

const ACTIVITY_SELECT = `
  SELECT
    a.id,
    a.action,
    a.detail,
    a.email,
    a."createdAt" AS created_at,
    u.name AS user_name
  FROM "AuditLog" a
  LEFT JOIN "User" u ON u.id = a."userId"
`;

/** Admin melihat aktivitas semua pengguna. */
export function allActivityQuery() {
  return rawSql<ActivityRow>(
    `${ACTIVITY_SELECT} ORDER BY a."createdAt" DESC LIMIT 20`,
  );
}

/** Kader hanya melihat aktivitas akunnya sendiri. */
export function userActivityQuery(userId: string) {
  return rawSql<ActivityRow>(
    `${ACTIVITY_SELECT} WHERE a."userId" = $1 ORDER BY a."createdAt" DESC LIMIT 20`,
    [userId],
  );
}

export function activityQueryFor(user: { id: string; role: string }) {
  return user.role === "ADMIN"
    ? allActivityQuery()
    : userActivityQuery(user.id);
}
