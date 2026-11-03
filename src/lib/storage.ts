import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

/**
 * Bucket privat yang dideklarasikan di neon.ts.
 * Objek di bucket ini hanya bisa dibaca lewat presigned URL.
 */
export const AVATAR_BUCKET = "assets";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

let files: Files | null = null;

/**
 * Files SDK membaca AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 * AWS_ENDPOINT_URL_S3, dan AWS_REGION yang di-inject Neon.
 */
export function getFiles(): Files {
  if (!files) {
    files = new Files({ adapter: neon({ bucket: AVATAR_BUCKET }) });
  }
  return files;
}

export function avatarExtension(contentType: string): string | null {
  return EXTENSION_BY_TYPE[contentType] ?? null;
}

/** Upload avatar ke key baru (tidak menimpa key lama, aman untuk cache). */
export async function uploadAvatar(
  userId: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  const extension = avatarExtension(contentType);
  if (!extension) {
    throw new Error("Tipe gambar tidak didukung");
  }

  const key = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;

  await getFiles().upload(key, body, {
    contentType,
    cacheControl: "private, max-age=3600",
  });

  return key;
}

/** Membuat presigned GET URL (bucket privat). */
export async function avatarUrl(
  key: string | null | undefined,
): Promise<string | null> {
  if (!key) return null;

  try {
    return await getFiles().url(key, { expiresIn: 3600 });
  } catch (error) {
    console.error("Gagal membuat presigned URL avatar:", error);
    return null;
  }
}

/** Hapus objek lama; kegagalan storage tidak boleh menggagalkan request. */
export async function deleteAvatar(
  key: string | null | undefined,
): Promise<void> {
  if (!key) return;

  try {
    await getFiles().delete(key);
  } catch (error) {
    console.error("Gagal menghapus avatar lama:", error);
  }
}

/** Ringkasan untuk health check /api/neon/status. */
export async function storageHealth(): Promise<{
  bucket: string;
  endpoint: string | null;
  region: string | null;
  sampleObjects: number;
}> {
  const result = await getFiles().list({ prefix: "avatars/", limit: 1 });

  return {
    bucket: AVATAR_BUCKET,
    endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? null,
    region: process.env.AWS_REGION ?? null,
    sampleObjects: result.items.length,
  };
}
