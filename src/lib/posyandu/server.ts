import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { BULAN, parseDateValue, toNumber, type RecordData } from "./compute";
import { getModuleConfig, type ModuleConfig } from "./modules";

type Delegate = {
  findMany: (args?: RecordData) => Promise<RecordData[]>;
  create: (args: { data: RecordData }) => Promise<RecordData>;
  update: (args: {
    where: { id: string };
    data: RecordData;
  }) => Promise<RecordData>;
  delete: (args: { where: { id: string } }) => Promise<RecordData>;
};

export function getDelegate(model: string): Delegate {
  return (prisma as unknown as Record<string, Delegate>)[model];
}

function normalizeAttendance(raw: unknown): Record<string, boolean> {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: Record<string, boolean> = {};
  for (const month of BULAN) result[month] = Boolean(source[month]);
  return result;
}

export function validateRequired(
  config: ModuleConfig,
  input: RecordData,
): string | null {
  for (const field of config.fields) {
    if (!field.required) continue;
    const value = input[field.name];
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return `${field.label} wajib diisi.`;
    }
  }
  return null;
}

/** Mengubah input form (string) menjadi tipe kolom Prisma + nilai hitungan. */
export function coerceInput(
  config: ModuleConfig,
  input: RecordData,
): RecordData {
  const data: RecordData = {};

  for (const field of config.fields) {
    if (field.persist === false) continue;
    if (field.type === "computed") continue;

    const raw = input[field.name];

    switch (field.type) {
      case "date":
        data[field.name] = parseDateValue(raw);
        break;
      case "number":
        data[field.name] = toNumber(raw);
        break;
      case "checkbox":
        data[field.name] = Boolean(raw);
        break;
      case "attendance":
        data[field.name] = normalizeAttendance(raw);
        break;
      case "json":
        data[field.name] =
          raw && typeof raw === "object" ? (raw as RecordData) : {};
        break;
      default:
        data[field.name] =
          raw === null || raw === undefined || raw === ""
            ? null
            : String(raw).trim();
    }
  }

  const computed = config.compute({ ...data, ...input });
  for (const field of config.fields) {
    if (field.type !== "computed" || field.persist === false) continue;
    if (computed[field.name] !== undefined) {
      data[field.name] = computed[field.name];
    }
  }

  return data;
}

export function serializeRecord(record: RecordData): RecordData {
  const result: RecordData = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = value instanceof Date ? value.toISOString() : value;
  }
  return result;
}

export async function logPosyandu(
  user: SessionUser,
  action: string,
  detail: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        email: user.email,
        userId: user.id,
        detail,
      },
    });
  } catch {
    // Audit log tidak boleh menggagalkan penyimpanan data utama.
  }
}

export function resolveModule(key: string) {
  const config = getModuleConfig(key);
  if (!config) return null;
  return { config, delegate: getDelegate(config.model) };
}
