import { Pool } from "pg";

// Satu pool per isolate, dipakai ulang antar request.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
});

// Jangan biarkan koneksi idle yang diputus Neon mematikan isolate.
pool.on("error", (error) => {
  console.error("[function] idle postgres error:", error.message);
});

/**
 * Health check Function: memastikan Function berjalan DAN bisa query Postgres.
 * URL Function bersifat publik, jadi wajib menyertakan shared secret.
 */
export default async function hello(request: Request): Promise<Response> {
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret || request.headers.get("x-internal-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { rows } = await pool.query(
      "select current_database() as database, now() as now",
    );

    return Response.json({
      ok: true,
      service: "neon-functions",
      branch: process.env.NEON_BRANCH ?? null,
      database: rows[0]?.database ?? null,
      now: rows[0]?.now ?? null,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "neon-functions",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
