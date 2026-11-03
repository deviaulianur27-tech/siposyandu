export type LpRow = { l: string; p: string };
export type LpGroup = Record<string, LpRow>;

export type AsiRow = {
  adaL: string;
  adaP: string;
  aeL: string;
  aeP: string;
  tidakAeL: string;
  tidakAeP: string;
};

export type DsRow = { d: string; s: string };

export type LaporanData = {
  sasaran: LpGroup;
  kms: LpGroup;
  naik: LpGroup;
  turun: LpGroup;
  o: LpGroup;
  baru: LpGroup;
  d: LpGroup;
  bgm: LpGroup;
  t2: LpGroup;
  imunisasi: LpGroup;
  ibuHamil: LpGroup;
  penyuluhan: Record<string, string>;
  ds: Record<string, DsRow>;
  asi: Record<string, AsiRow>;
  kader: { hadir: string; aktif: string; catatan: string };
};

export type LpSectionKey =
  | "sasaran"
  | "kms"
  | "naik"
  | "turun"
  | "o"
  | "baru"
  | "d"
  | "bgm"
  | "t2"
  | "imunisasi"
  | "ibuHamil";

export const BALITA_ROWS = [
  "0-5 Bln",
  "6-11 Bln",
  "12-23 Bln",
  "24-59 Bln",
] as const;

export const DUA_KELOMPOK_ROWS = ["0-23 Bln", "24-59 Bln"] as const;

export const IMUNISASI_ROWS = [
  "HB 0",
  "BCG/Polio 1",
  "DPT-HIB I/PCV I/Polio 1",
  "DPT-HIB II/PCV II/Polio 2",
  "DPT-HIB III/IPV/Polio 3",
  "Campak/MR",
  "PCV III",
  "Campak Lanjutan",
  "DPT-HIB Lanjutan",
] as const;

export const IBU_HAMIL_ROWS = [
  "Ibu Hamil",
  "Ibu Hamil Risiko Tinggi",
  "Ibu Hamil Anemia",
  "Ibu Hamil KEK",
] as const;

export const PENYULUHAN_ROWS = [
  "Imunisasi",
  "ASI Eksklusif",
  "PMBA",
  "Stunting",
  "Vitamin A",
  "Anemia pada Bumil",
  "Garam Beryodium",
  "PHBS/Diare",
] as const;

export const DS_ROWS = ["LANSIA", "PTM", "REMAJA"] as const;

export const ASI_ROWS = [
  "Umur 0 Bln",
  "Umur 1 Bln",
  "Umur 2 Bln",
  "Umur 3 Bln",
  "Umur 4 Bln",
  "Umur 5 Bln",
] as const;

export const LP_SECTIONS: {
  key: LpSectionKey;
  title: string;
  rows: readonly string[];
}[] = [
  { key: "sasaran", title: "1. Jumlah Sasaran", rows: BALITA_ROWS },
  { key: "kms", title: "2. KMS (K)", rows: DUA_KELOMPOK_ROWS },
  { key: "naik", title: "3. Naik (N)", rows: DUA_KELOMPOK_ROWS },
  { key: "turun", title: "4. Turun (T)", rows: DUA_KELOMPOK_ROWS },
  {
    key: "o",
    title: "5. Ditimbang Bulan Ini, Bulan Lalu Tidak (O)",
    rows: DUA_KELOMPOK_ROWS,
  },
  { key: "baru", title: "6. Baru (B)", rows: DUA_KELOMPOK_ROWS },
  { key: "d", title: "7. Ditimbang (D)", rows: DUA_KELOMPOK_ROWS },
  { key: "bgm", title: "8. Bawah Garis Merah (BGM)", rows: DUA_KELOMPOK_ROWS },
  {
    key: "t2",
    title: "9. Tidak Naik 2 Kali Berturut-turut (T2)",
    rows: DUA_KELOMPOK_ROWS,
  },
  {
    key: "imunisasi",
    title: "10. Imunisasi (jenis vaksin)",
    rows: IMUNISASI_ROWS,
  },
  {
    key: "ibuHamil",
    title: "11. Jumlah Ibu Hamil",
    rows: IBU_HAMIL_ROWS,
  },
];

function emptyLpGroup(rows: readonly string[]): LpGroup {
  return Object.fromEntries(rows.map((row) => [row, { l: "", p: "" }]));
}

export function emptyLaporanData(): LaporanData {
  return {
    sasaran: emptyLpGroup(BALITA_ROWS),
    kms: emptyLpGroup(DUA_KELOMPOK_ROWS),
    naik: emptyLpGroup(DUA_KELOMPOK_ROWS),
    turun: emptyLpGroup(DUA_KELOMPOK_ROWS),
    o: emptyLpGroup(DUA_KELOMPOK_ROWS),
    baru: emptyLpGroup(DUA_KELOMPOK_ROWS),
    d: emptyLpGroup(DUA_KELOMPOK_ROWS),
    bgm: emptyLpGroup(DUA_KELOMPOK_ROWS),
    t2: emptyLpGroup(DUA_KELOMPOK_ROWS),
    imunisasi: emptyLpGroup(IMUNISASI_ROWS),
    ibuHamil: emptyLpGroup(IBU_HAMIL_ROWS),
    penyuluhan: Object.fromEntries(PENYULUHAN_ROWS.map((row) => [row, ""])),
    ds: Object.fromEntries(DS_ROWS.map((row) => [row, { d: "", s: "" }])),
    asi: Object.fromEntries(
      ASI_ROWS.map((row) => [
        row,
        { adaL: "", adaP: "", aeL: "", aeP: "", tidakAeL: "", tidakAeP: "" },
      ]),
    ),
    kader: { hadir: "", aktif: "", catatan: "" },
  };
}

function mergeGroup<T extends Record<string, unknown>>(
  base: T,
  source: unknown,
): T {
  if (!source || typeof source !== "object") return base;
  const result = { ...base };
  for (const key of Object.keys(base)) {
    const value = (source as Record<string, unknown>)[key];
    if (value !== undefined) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}

/** Melengkapi data JSON lama agar selalu memiliki semua baris. */
export function mergeLaporanData(raw: unknown): LaporanData {
  const empty = emptyLaporanData();
  if (!raw || typeof raw !== "object") return empty;
  const source = raw as Partial<LaporanData>;

  return {
    ...empty,
    ...source,
    sasaran: mergeGroup(empty.sasaran, source.sasaran),
    kms: mergeGroup(empty.kms, source.kms),
    naik: mergeGroup(empty.naik, source.naik),
    turun: mergeGroup(empty.turun, source.turun),
    o: mergeGroup(empty.o, source.o),
    baru: mergeGroup(empty.baru, source.baru),
    d: mergeGroup(empty.d, source.d),
    bgm: mergeGroup(empty.bgm, source.bgm),
    t2: mergeGroup(empty.t2, source.t2),
    imunisasi: mergeGroup(empty.imunisasi, source.imunisasi),
    ibuHamil: mergeGroup(empty.ibuHamil, source.ibuHamil),
    penyuluhan: mergeGroup(empty.penyuluhan, source.penyuluhan),
    ds: mergeGroup(empty.ds, source.ds),
    asi: mergeGroup(empty.asi, source.asi),
    kader: { ...empty.kader, ...(source.kader ?? {}) },
  };
}

export function n(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sumLp(row: LpRow): string {
  if (row.l === "" && row.p === "") return "";
  return String(n(row.l) + n(row.p));
}

export function sumGroup(group: LpGroup, rows: readonly string[]) {
  return rows.reduce(
    (total, row) => ({
      l: total.l + n(group[row]?.l),
      p: total.p + n(group[row]?.p),
    }),
    { l: 0, p: 0 },
  );
}

export function dsPercent(row: DsRow): string {
  const s = n(row.s);
  if (s === 0) return "";
  return `${((n(row.d) / s) * 100).toFixed(1).replace(".", ",")}%`;
}

export function asiTotal(row: AsiRow): string {
  if (row.adaL === "" && row.adaP === "") return "";
  return String(n(row.adaL) + n(row.adaP));
}
