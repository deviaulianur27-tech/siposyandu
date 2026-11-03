import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { isRole, type Role } from "@/lib/roles";

export const SESSION_COOKIE = "siposyandu_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET belum diatur (minimal 16 karakter). Periksa file .env",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Membuat JWT dan menyimpannya di cookie httpOnly. */
export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Menghapus cookie sesi. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Membaca sesi dari cookie tanpa menyentuh database. */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (
      !payload.sub ||
      typeof payload.name !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.email !== "string" ||
      !isRole(payload.role)
    ) {
      return null;
    }

    return {
      id: payload.sub,
      name: payload.name,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Mengambil user aktif dari database berdasarkan sesi.
 * Dipakai di server component agar akun yang dinonaktifkan langsung ter-logout.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || !isRole(user.role)) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

/** Untuk halaman: wajib login, kalau belum redirect ke /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Untuk halaman: wajib punya salah satu role. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/** Untuk API route: mengembalikan user atau null (tidak redirect). */
export async function getApiUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}
