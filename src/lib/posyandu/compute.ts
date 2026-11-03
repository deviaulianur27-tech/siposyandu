/**
 * Rumus-rumus yang dipakai pada Form_Posyandu_Pede_Seneng.xlsx.
 * Semua fungsi murni (tanpa akses server) supaya bisa dipakai di form
 * (pratinjau langsung) maupun di API (nilai yang disimpan).
 */

export type RecordData = Record<string, unknown>;

export const BULAN = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGT",
  "SPT",
  "OKT",
  "NOV",
  "DES",
] as const;

export function parseDateValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const text = String(value);
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** DATEDIF(...,"Y") — jumlah tahun penuh. */
export function completedYears(birth: unknown, at: unknown): number | null {
  const from = parseDateValue(birth);
  const to = parseDateValue(at);
  if (!from || !to || to < from) return null;

  let years = to.getFullYear() - from.getFullYear();
  const monthDiff = to.getMonth() - from.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && to.getDate() < from.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

/** DATEDIF(...,"M") — jumlah bulan penuh. */
export function completedMonths(birth: unknown, at: unknown): number | null {
  const from = parseDateValue(birth);
  const to = parseDateValue(at);
  if (!from || !to || to < from) return null;

  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Hasil tekanan darah: Tinggi / Rendah / Normal. */
export function bloodPressureResult(
  systole: unknown,
  diastole: unknown,
): string {
  const sys = toNumber(systole);
  const dia = toNumber(diastole);
  if (sys === null || dia === null) return "";
  if (sys >= 140 || dia >= 90) return "Tinggi";
  if (sys < 90 || dia < 60) return "Rendah";
  return "Normal";
}

/** IMT = BB / (TB/100)^2, satu desimal. */
export function bodyMassIndex(weight: unknown, height: unknown): number | null {
  const bb = toNumber(weight);
  const tb = toNumber(height);
  if (bb === null || tb === null || tb <= 0) return null;
  return round1(bb / Math.pow(tb / 100, 2));
}

export function imtStatus(imt: unknown): string {
  const value = toNumber(imt);
  if (value === null) return "";
  if (value < 17) return "Sangat Kurus";
  if (value < 18.5) return "Kurus";
  if (value <= 25) return "Normal";
  if (value <= 27) return "Gemuk";
  return "Obesitas";
}

export function lilaIbuHamilResult(lila: unknown): string {
  const value = toNumber(lila);
  if (value === null) return "";
  return value < 23.5 ? "KEK (<23,5)" : "Normal (≥23,5)";
}

export function lilaLansiaFlag(lila: unknown): string {
  const value = toNumber(lila);
  if (value === null) return "";
  return value < 21 ? "Ya" : "Tidak";
}

function countYes(values: unknown[]): number {
  return values.filter((value) => value === "Ya").length;
}

function hasAnyValue(values: unknown[]): boolean {
  return values.some(
    (value) => value !== null && value !== undefined && value !== "",
  );
}

/** Skrining TBC: rujuk bila ≥2 gejala "Ya". */
export function tbcResult(values: unknown[]): string {
  if (!hasAnyValue(values)) return "";
  return countYes(values) >= 2 ? "Rujuk Puskesmas" : "Tidak";
}

/** SKILAS: rujuk bila ≥1 jawaban "Ya". */
export function skilasResult(values: unknown[]): string {
  if (!hasAnyValue(values)) return "";
  return countYes(values) >= 1 ? "Rujuk Puskesmas" : "Normal";
}

/** Skor PUMA + keputusan rujuk (ambang 6). */
export function pumaScore(data: RecordData): {
  skorJk: number | null;
  skorUsia: number | null;
  skorPuma: number | null;
  rujukPuma: string;
} {
  const umur = toNumber(data.umur);
  const jk = data.jenisKelamin;
  const skorJk = jk === "L" ? 1 : jk === "P" ? 0 : null;

  let skorUsia: number | null = null;
  if (umur !== null && umur >= 40) {
    skorUsia = umur < 50 ? 0 : umur < 60 ? 1 : 2;
  }

  if (skorUsia === null || skorJk === null) {
    return { skorJk, skorUsia, skorPuma: null, rujukPuma: "" };
  }

  const merokok = toNumber(data.skorMerokok) ?? 0;
  const skorPuma =
    skorJk +
    skorUsia +
    merokok +
    (data.napasPendek === "Ya" ? 1 : 0) +
    (data.dahak === "Ya" ? 1 : 0) +
    (data.batuk === "Ya" ? 1 : 0) +
    (data.spirometri === "Ya" ? 2 : 0);

  return {
    skorJk,
    skorUsia,
    skorPuma,
    rujukPuma: skorPuma > 6 ? "Rujuk" : "",
  };
}

export function kategoriSasaran(data: RecordData): string {
  const labels: string[] = [];
  if (data.kategoriBalita) labels.push("Balita");
  if (data.kategoriRemaja) labels.push("Remaja");
  if (data.kategoriPtm) labels.push("PTM");
  if (data.kategoriLansia) labels.push("Lansia");
  return labels.join(", ");
}
