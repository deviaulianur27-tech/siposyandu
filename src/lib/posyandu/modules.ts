import {
  BULAN,
  bloodPressureResult,
  bodyMassIndex,
  completedMonths,
  completedYears,
  imtStatus,
  kategoriSasaran,
  lilaIbuHamilResult,
  lilaLansiaFlag,
  pumaScore,
  skilasResult,
  tbcResult,
  type RecordData,
} from "./compute";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "computed"
  | "attendance"
  | "json";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  section?: string;
  options?: readonly string[];
  placeholder?: string;
  required?: boolean;
  help?: string;
  step?: string;
  min?: number;
  max?: number;
  span?: 1 | 2 | 3 | 4;
  /** false = hanya tampilan (tidak ada kolom di database). */
  persist?: boolean;
  /** true = tidak ditampilkan pada form generik. */
  hidden?: boolean;
};

export type ModuleConfig = {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  /** Nama delegate Prisma. */
  model: string;
  fields: FieldConfig[];
  compute: (data: RecordData) => RecordData;
  orderBy: Record<string, "asc" | "desc">[];
  tableColumns: string[];
  defaultValues?: RecordData;
};

const f = (
  name: string,
  label: string,
  type: FieldType,
  options: Partial<FieldConfig> = {},
): FieldConfig => ({ name, label, type, ...options });

const JK = ["L", "P"] as const;
const YA_TIDAK = ["Ya", "Tidak"] as const;
const NORMAL_GANGGUAN = ["Normal", "Gangguan"] as const;
const TD_RESULT = ["Rendah", "Normal", "Tinggi"] as const;

const IDENTITAS_DEWASA: FieldConfig[] = [
  f("noKartu", "No. Kartu", "text", { section: "Identitas" }),
  f("nama", "Nama", "text", { section: "Identitas", required: true }),
  f("nik", "NIK", "text", { section: "Identitas" }),
  f("tanggalLahir", "Tanggal Lahir", "date", { section: "Identitas" }),
  f("jenisKelamin", "JK (L/P)", "select", {
    section: "Identitas",
    options: JK,
  }),
  f("alamat", "Alamat", "text", { section: "Identitas", span: 2 }),
  f("noHp", "No. HP", "text", { section: "Identitas" }),
  f("statusPerkawinan", "Status Perkawinan", "select", {
    section: "Identitas",
    options: ["Menikah", "Tidak Menikah"],
  }),
  f("pekerjaan", "Pekerjaan", "text", { section: "Identitas" }),
  f("dusun", "Dusun/RT/RW", "text", { section: "Identitas" }),
  f("desa", "Desa/Kelurahan/Nagari", "text", { section: "Identitas" }),
  f("kecamatan", "Kecamatan", "text", { section: "Identitas" }),
];

export const MODULES: ModuleConfig[] = [
  {
    key: "pendaftaran",
    title: "Buku Pendaftaran",
    shortTitle: "Pendaftaran",
    description:
      "Daftar sasaran Posyandu Pede Seneng beserta kategori dan kehadiran Januari–Desember.",
    model: "sasaran",
    orderBy: [{ no: "asc" }, { createdAt: "asc" }],
    defaultValues: { kehadiran: {} },
    compute: (data) => {
      const kehadiran =
        data.kehadiran && typeof data.kehadiran === "object"
          ? (data.kehadiran as Record<string, unknown>)
          : {};
      return {
        kategoriLabel: kategoriSasaran(data),
        hadirBulan: BULAN.filter((month) => Boolean(kehadiran[month])).join(
          ", ",
        ),
      };
    },
    tableColumns: [
      "no",
      "nama",
      "jenisKelamin",
      "alamat",
      "noHp",
      "kategoriLabel",
      "hadirBulan",
    ],
    fields: [
      f("no", "No", "number", { section: "Identitas", min: 1 }),
      f("nama", "Nama Sasaran", "text", {
        section: "Identitas",
        required: true,
      }),
      f("noKk", "No. KK", "text", { section: "Identitas" }),
      f("jenisKelamin", "Jenis Kelamin", "select", {
        section: "Identitas",
        options: JK,
      }),
      f("alamat", "Alamat", "text", { section: "Identitas" }),
      f("tanggalLahir", "Tanggal Lahir", "date", { section: "Identitas" }),
      f("noHp", "No. HP", "text", { section: "Identitas" }),
      f("kategoriLansia", "Lansia", "checkbox", {
        section: "Kategori Sasaran",
      }),
      f("kategoriPtm", "PTM", "checkbox", { section: "Kategori Sasaran" }),
      f("kategoriRemaja", "Remaja", "checkbox", {
        section: "Kategori Sasaran",
      }),
      f("kategoriBalita", "Balita 0–59 bln", "checkbox", {
        section: "Kategori Sasaran",
      }),
      f("kategoriLabel", "Kategori", "computed", {
        section: "Kategori Sasaran",
        persist: false,
      }),
      f("kehadiran", "Kehadiran Jan–Des", "attendance", {
        section: "Kehadiran Bulan",
        span: 4,
      }),
      f("hadirBulan", "Bulan Hadir", "computed", {
        section: "Kehadiran Bulan",
        persist: false,
      }),
    ],
  },
  {
    key: "ibu-hamil",
    title: "Kartu Ibu Hamil / Nifas / Menyusui",
    shortTitle: "Ibu Hamil",
    description:
      "Kartu bantu pemeriksaan ibu hamil. Hasil LiLA, tekanan darah, dan skrining TBC dihitung otomatis.",
    model: "kunjunganIbuHamil",
    orderBy: [{ createdAt: "desc" }],
    compute: (data) => ({
      hasilLila: lilaIbuHamilResult(data.lila),
      hasilTd: bloodPressureResult(data.sistole, data.diastole),
      hasilTbc: tbcResult([
        data.tbcBatuk,
        data.tbcDemam,
        data.tbcBbTurun,
        data.tbcKontak,
      ]),
    }),
    tableColumns: [
      "nama",
      "tanggalKunjungan",
      "usiaKehamilan",
      "bb",
      "lila",
      "hasilLila",
      "sistole",
      "diastole",
      "hasilTd",
      "hasilTbc",
      "rujuk",
    ],
    fields: [
      f("nama", "Nama", "text", { section: "Identitas", required: true }),
      f("nik", "NIK", "text", { section: "Identitas" }),
      f("tanggalLahir", "Tanggal Lahir", "date", { section: "Identitas" }),
      f("namaSuami", "Nama Suami", "text", { section: "Identitas" }),
      f("alamat", "Alamat", "text", { section: "Identitas", span: 2 }),
      f("noHp", "No. HP", "text", { section: "Identitas" }),
      f("dusun", "Dusun/RT/RW", "text", { section: "Identitas" }),
      f("desa", "Desa/Kelurahan/Nagari", "text", { section: "Identitas" }),
      f("kecamatan", "Kecamatan", "text", { section: "Identitas" }),
      f("hamilAnakKe", "Hamil Anak ke", "number", {
        section: "Identitas",
        min: 1,
      }),
      f("jarakAnak", "Jarak Anak Sebelumnya", "text", {
        section: "Identitas",
        placeholder: "contoh: 3 th",
      }),
      f("beratBadanAwal", "Berat Badan Awal (Kg)", "number", {
        section: "Identitas",
        step: "0.1",
      }),
      f("tinggiBadan", "Tinggi Badan (Cm)", "number", {
        section: "Identitas",
        step: "0.1",
      }),
      f("tanggalKunjungan", "Waktu ke Posyandu (tgl)", "date", {
        section: "Kunjungan",
      }),
      f("usiaKehamilan", "Usia Kehamilan (minggu ke-)", "number", {
        section: "Kunjungan",
        min: 1,
        max: 42,
      }),
      f("bb", "BB (Kg)", "number", {
        section: "Kunjungan",
        step: "0.1",
      }),
      f("bbKurva", "BB sesuai kurva Buku KIA", "select", {
        section: "Kunjungan",
        options: YA_TIDAK,
      }),
      f("lila", "LiLA (Cm)", "number", { section: "LiLA", step: "0.1" }),
      f("hasilLila", "Hasil LiLA", "computed", { section: "LiLA" }),
      f("sistole", "Sistole", "number", {
        section: "Tekanan Darah",
        min: 0,
      }),
      f("diastole", "Diastole", "number", {
        section: "Tekanan Darah",
        min: 0,
      }),
      f("hasilTd", "Hasil TD", "computed", {
        section: "Tekanan Darah",
      }),
      f("tbcBatuk", "Batuk terus menerus", "select", {
        section: "Skrining TBC",
        options: YA_TIDAK,
      }),
      f("tbcDemam", "Demam ≥2 minggu", "select", {
        section: "Skrining TBC",
        options: YA_TIDAK,
      }),
      f("tbcBbTurun", "BB tidak naik / turun dalam 2 bulan", "select", {
        section: "Skrining TBC",
        options: YA_TIDAK,
      }),
      f("tbcKontak", "Kontak erat pasien TBC", "select", {
        section: "Skrining TBC",
        options: YA_TIDAK,
      }),
      f("hasilTbc", "Hasil Skrining TBC", "computed", {
        section: "Skrining TBC",
      }),
      f("tabletDarah", "Konsumsi Tablet Tambah Darah", "select", {
        section: "Tablet Tambah Darah",
        options: YA_TIDAK,
      }),
      f("jumlahTablet", "Jumlah Tablet", "number", {
        section: "Tablet Tambah Darah",
        min: 0,
      }),
      f("mtKek", "Konsumsi MT Bumil KEK", "select", {
        section: "Makanan Tambahan",
        options: YA_TIDAK,
      }),
      f("kondisiMt", "Kondisi / Jumlah MT", "text", {
        section: "Makanan Tambahan",
        span: 2,
      }),
      f("kelasIbuHamil", "Mengikuti Kelas Ibu Hamil", "select", {
        section: "Lainnya",
        options: YA_TIDAK,
      }),
      f("edukasi", "Edukasi", "textarea", {
        section: "Lainnya",
        span: 2,
      }),
      f("rujuk", "Rujuk Pustu/Puskesmas/RS", "textarea", {
        section: "Lainnya",
        span: 2,
      }),
    ],
  },
  {
    key: "remaja",
    title: "Kartu Kontrol Posyandu Keluarga — Remaja",
    shortTitle: "Remaja",
    description:
      "Kartu kontrol remaja. Umur dan hasil tekanan darah dihitung otomatis.",
    model: "kunjunganRemaja",
    orderBy: [{ createdAt: "desc" }],
    compute: (data) => ({
      umur: completedYears(data.tanggalLahir, data.jadwalPosyandu),
      hasilTd: bloodPressureResult(data.sistole, data.diastole),
    }),
    tableColumns: [
      "nama",
      "jadwalPosyandu",
      "umur",
      "bb",
      "tb",
      "hasilTd",
      "hbAnemia",
      "konseling",
    ],
    fields: [
      f("noUrutReg", "No Urut Reg.", "text", { section: "Identitas" }),
      f("noUrutKk", "No Urut KK", "text", { section: "Identitas" }),
      f("nama", "Nama", "text", { section: "Identitas", required: true }),
      f("nik", "NIK", "text", { section: "Identitas" }),
      f("noJkn", "No. JKN", "text", { section: "Identitas" }),
      f("tanggalLahir", "Tgl Lahir", "date", { section: "Identitas" }),
      f("jenisKelamin", "JK (L/P)", "select", {
        section: "Identitas",
        options: JK,
      }),
      f("pendidikan", "Pendidikan", "text", { section: "Identitas" }),
      f("namaKk", "Nama Kepala Keluarga", "text", {
        section: "Identitas",
        span: 2,
      }),
      f("jadwalPosyandu", "Jadwal Posyandu (tgl)", "date", {
        section: "Pemeriksaan",
      }),
      f("umur", "Umur (Tahun)", "computed", { section: "Pemeriksaan" }),
      f("bb", "BB (Kg)", "number", {
        section: "Pemeriksaan",
        step: "0.1",
      }),
      f("tb", "TB (Cm)", "number", { section: "Pemeriksaan", step: "0.1" }),
      f("lila", "LiLA (Cm)", "number", {
        section: "Pemeriksaan",
        step: "0.1",
      }),
      f("lingkarPerut", "L. Perut (Cm)", "number", {
        section: "Pemeriksaan",
        step: "0.1",
      }),
      f("sistole", "Sistole", "number", { section: "Pemeriksaan" }),
      f("diastole", "Diastole", "number", { section: "Pemeriksaan" }),
      f("hasilTd", "Hasil TD", "computed", { section: "Pemeriksaan" }),
      f("hbAnemia", "Hb / Anemia (tanda klinis)", "text", {
        section: "Pemeriksaan",
      }),
      f("feRematri", "Fe Rematri", "text", { section: "Pemeriksaan" }),
      f("psq", "PSQ", "text", { section: "Mental Emosional" }),
      f("sdq", "SDQ", "text", { section: "Mental Emosional" }),
      f("heeadsss", "HEEADSSS", "text", { section: "Mental Emosional" }),
      f("konseling", "Konseling / Penyuluhan", "textarea", {
        section: "Lainnya",
        span: 2,
      }),
      f("keterangan", "Ket.", "textarea", {
        section: "Lainnya",
        span: 2,
      }),
    ],
  },
  {
    key: "dewasa",
    title: "Kartu Bantu Pemeriksaan Usia Dewasa",
    shortTitle: "Dewasa",
    description:
      "Kartu pemeriksaan usia dewasa (>19 tahun). IMT, hasil TD, skor PUMA, dan skrining TBC dihitung otomatis.",
    model: "kunjunganDewasa",
    orderBy: [{ createdAt: "desc" }],
    compute: (data) => {
      const umur = completedYears(data.tanggalLahir, data.tanggalKunjungan);
      const imt = bodyMassIndex(data.bb, data.tb);
      const puma = pumaScore({ ...data, umur });
      return {
        umur,
        imt,
        statusImt: imtStatus(imt),
        hasilTd: bloodPressureResult(data.sistole, data.diastole),
        ...puma,
        hasilTbc: tbcResult([
          data.tbcBatuk,
          data.tbcDemam,
          data.tbcBbTurun,
          data.tbcKontak,
        ]),
      };
    },
    tableColumns: [
      "nama",
      "tanggalKunjungan",
      "umur",
      "imt",
      "statusImt",
      "hasilTd",
      "skorPuma",
      "rujukPuma",
      "hasilTbc",
    ],
    fields: [
      ...IDENTITAS_DEWASA,
      f("riwayatKeluarga", "Riwayat Keluarga", "textarea", {
        section: "Riwayat",
        span: 2,
        placeholder: "Hi/DM/Stroke/Jantung/Kanker/Kolesterol",
      }),
      f("riwayatDiri", "Riwayat Diri Sendiri", "textarea", {
        section: "Riwayat",
        span: 2,
      }),
      f("perilakuBerisiko", "Perilaku Berisiko", "textarea", {
        section: "Riwayat",
        span: 2,
        placeholder: "Merokok/Gula/Garam/Lemak",
      }),
      f("tanggalKunjungan", "Waktu ke Posyandu (tgl)", "date", {
        section: "Penimbangan / Pemeriksaan",
      }),
      f("umur", "Umur (tahun)", "computed", {
        section: "Penimbangan / Pemeriksaan",
      }),
      f("bb", "Berat Badan (Kg)", "number", {
        section: "Penimbangan / Pemeriksaan",
        step: "0.1",
      }),
      f("tb", "Tinggi Badan (Cm)", "number", {
        section: "Penimbangan / Pemeriksaan",
        step: "0.1",
      }),
      f("imt", "IMT", "computed", {
        section: "Penimbangan / Pemeriksaan",
      }),
      f("statusImt", "Status IMT", "computed", {
        section: "Penimbangan / Pemeriksaan",
      }),
      f("lingkarPerut", "Lingkar Perut (Cm)", "number", {
        section: "Penimbangan / Pemeriksaan",
        step: "0.1",
      }),
      f("lila", "Lingkar Lengan Atas (Cm)", "number", {
        section: "Penimbangan / Pemeriksaan",
        step: "0.1",
      }),
      f("sistole", "Sistole", "number", {
        section: "Penimbangan / Pemeriksaan",
      }),
      f("diastole", "Diastole", "number", {
        section: "Penimbangan / Pemeriksaan",
      }),
      f("hasilTd", "Hasil Tekanan Darah", "computed", {
        section: "Penimbangan / Pemeriksaan",
      }),
      f("gulaDarah", "Gula Darah Sewaktu (mg/dL)", "number", {
        section: "Penimbangan / Pemeriksaan",
        step: "0.1",
      }),
      f("hasilGulaDarah", "Hasil Gula Darah", "select", {
        section: "Penimbangan / Pemeriksaan",
        options: ["Normal", "Tinggi", "Rendah"],
      }),
      f("mataKanan", "Mata Kanan", "select", {
        section: "Hitung Jari & Tes Berbisik",
        options: NORMAL_GANGGUAN,
      }),
      f("mataKiri", "Mata Kiri", "select", {
        section: "Hitung Jari & Tes Berbisik",
        options: NORMAL_GANGGUAN,
      }),
      f("telingaKanan", "Telinga Kanan", "select", {
        section: "Hitung Jari & Tes Berbisik",
        options: NORMAL_GANGGUAN,
      }),
      f("telingaKiri", "Telinga Kiri", "select", {
        section: "Hitung Jari & Tes Berbisik",
        options: NORMAL_GANGGUAN,
      }),
      f("skorJk", "Skor Jenis Kelamin (Pr=0, Lk=1)", "computed", {
        section: "Kuesioner PPOK / PUMA",
      }),
      f("skorUsia", "Skor Usia (40-49=0, 50-59=1, ≥60=2)", "computed", {
        section: "Kuesioner PPOK / PUMA",
      }),
      f("skorMerokok", "Skor Merokok (0/1/2)", "number", {
        section: "Kuesioner PPOK / PUMA",
        min: 0,
        max: 2,
      }),
      f("napasPendek", "Pernah merasa napas pendek saat berjalan cepat?", "select", {
        section: "Kuesioner PPOK / PUMA",
        options: YA_TIDAK,
      }),
      f("dahak", "Punya dahak dari paru / kesulitan?", "select", {
        section: "Kuesioner PPOK / PUMA",
        options: YA_TIDAK,
      }),
      f("batuk", "Biasanya batuk saat tidak flu?", "select", {
        section: "Kuesioner PPOK / PUMA",
        options: YA_TIDAK,
      }),
      f("spirometri", "Dokter pernah minta spirometri?", "select", {
        section: "Kuesioner PPOK / PUMA",
        options: YA_TIDAK,
      }),
      f("skorPuma", "Skor PUMA", "computed", {
        section: "Kuesioner PPOK / PUMA",
      }),
      f("rujukPuma", "Rujuk PUMA", "computed", {
        section: "Kuesioner PPOK / PUMA",
      }),
      f("tbcBatuk", "Batuk terus menerus", "select", {
        section: "Skrining Gejala TBC",
        options: YA_TIDAK,
      }),
      f("tbcDemam", "Demam ≥2 minggu", "select", {
        section: "Skrining Gejala TBC",
        options: YA_TIDAK,
      }),
      f("tbcBbTurun", "BB tidak naik / turun dalam 2 bulan", "select", {
        section: "Skrining Gejala TBC",
        options: YA_TIDAK,
      }),
      f("tbcKontak", "Kontak erat dengan pasien TBC", "select", {
        section: "Skrining Gejala TBC",
        options: YA_TIDAK,
      }),
      f("hasilTbc", "Hasil Skrining TBC", "computed", {
        section: "Skrining Gejala TBC",
      }),
      f(
        "alatKontrasepsi",
        "Wawancara: Pakai Alat Kontrasepsi (Pil/Kondom/Lainnya)",
        "text",
        { section: "Lainnya", span: 2 },
      ),
      f("edukasi", "Edukasi", "textarea", {
        section: "Lainnya",
        span: 2,
      }),
      f("rujuk", "Rujuk Pustu/Puskesmas", "textarea", {
        section: "Lainnya",
        span: 2,
      }),
    ],
  },
  {
    key: "lansia",
    title: "Kartu Bantu Pemeriksaan Lansia (≥60 Tahun)",
    shortTitle: "Lansia",
    description:
      "Kartu pemeriksaan lansia dengan SKILAS. Hasil rujukan dihitung otomatis.",
    model: "kunjunganLansia",
    orderBy: [{ createdAt: "desc" }],
    compute: (data) => {
      const skilasLila = lilaLansiaFlag(data.lila);
      return {
        umur: completedYears(data.tanggalLahir, data.tanggalKunjungan),
        hasilTd: bloodPressureResult(data.sistole, data.diastole),
        skilasLila,
        hasilSkilas: skilasResult([
          data.skilasOrientasi,
          data.skilasMengulang,
          data.skilasBerdiri,
          data.skilasBbTurun,
          data.skilasNafsuMakan,
          skilasLila,
          data.skilasMata,
          data.skilasTesMelihat,
          data.skilasTesBisik,
          data.skilasSedih,
          data.skilasMinat,
        ]),
      };
    },
    tableColumns: [
      "nama",
      "tanggalKunjungan",
      "umur",
      "hasilTd",
      "hasilSkilas",
      "rujuk",
    ],
    fields: [
      ...IDENTITAS_DEWASA,
      f("tanggalKunjungan", "Waktu ke Posyandu (tgl)", "date", {
        section: "Pemeriksaan",
      }),
      f("umur", "Umur (tahun)", "computed", { section: "Pemeriksaan" }),
      f("bb", "Berat Badan (Kg)", "number", {
        section: "Pemeriksaan",
        step: "0.1",
      }),
      f("tb", "Tinggi Badan (Cm)", "number", {
        section: "Pemeriksaan",
        step: "0.1",
      }),
      f("lingkarPerut", "Lingkar Perut (Cm)", "number", {
        section: "Pemeriksaan",
        step: "0.1",
      }),
      f("lila", "LiLA (Cm)", "number", {
        section: "Pemeriksaan",
        step: "0.1",
      }),
      f("sistole", "Sistole", "number", { section: "Pemeriksaan" }),
      f("diastole", "Diastole", "number", { section: "Pemeriksaan" }),
      f("hasilTd", "Hasil Tekanan Darah", "computed", {
        section: "Pemeriksaan",
      }),
      f("gulaDarah", "Gula Darah Sewaktu (mg/dL)", "number", {
        section: "Pemeriksaan",
        step: "0.1",
      }),
      f("skilasOrientasi", "Orientasi waktu dan tempat (gangguan?)", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasMengulang", "Mengulang ketiga kata (gagal?)", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasBerdiri", "Tes berdiri dari kursi (tidak mampu?)", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasBbTurun", "BB berkurang >3 kg dalam 3 bulan", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasNafsuMakan", "Hilang nafsu makan / kesulitan makan", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasLila", "LiLA < 21 cm", "computed", {
        section: "Skrining Lansia Sederhana (SKILAS)",
      }),
      f("skilasMata", "Masalah pada mata (jauh/baca/penyakit mata)", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasTesMelihat", "Tes melihat (tidak dapat)", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasTesBisik", "Tes bisik (tidak dapat)", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasSedih", "Perasaan sedih/tertekan 2 minggu", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("skilasMinat", "Sedikit minat/kesenangan melakukan sesuatu", "select", {
        section: "Skrining Lansia Sederhana (SKILAS)",
        options: YA_TIDAK,
      }),
      f("hasilSkilas", "Hasil SKILAS", "computed", {
        section: "Skrining Lansia Sederhana (SKILAS)",
      }),
      f("imunisasiCovid", "Imunisasi COVID-19", "select", {
        section: "Lainnya",
        options: YA_TIDAK,
      }),
      f("edukasi", "Edukasi", "textarea", {
        section: "Lainnya",
        span: 2,
      }),
      f("rujuk", "Rujuk Pustu/Puskesmas", "textarea", {
        section: "Lainnya",
        span: 2,
      }),
    ],
  },
  {
    key: "laporan-nama",
    title: "Daftar Nama untuk Laporan",
    shortTitle: "Daftar Nama",
    description:
      "Daftar BGM, Balita T2, Bayi Baru Lahir, Bumil KEK, dan Bumil Anemia.",
    model: "laporanKasus",
    orderBy: [{ kategori: "asc" }, { createdAt: "desc" }],
    compute: (data) => ({
      umurBulan: completedMonths(data.tanggalLahir, data.tanggalUkur),
    }),
    tableColumns: [
      "kategori",
      "nama",
      "namaOrangTua",
      "jenisKelamin",
      "umurBulan",
      "bb",
      "tbLila",
      "hb",
    ],
    fields: [
      f("kategori", "Kategori", "select", {
        section: "Data",
        required: true,
        options: [
          "BGM",
          "Balita T2",
          "Bayi Baru Lahir",
          "Bumil KEK",
          "Bumil Anemia",
        ],
      }),
      f("nama", "Nama", "text", { section: "Data", required: true }),
      f(
        "namaOrangTua",
        "Nama Orang Tua (Ayah+Ibu) / Suami",
        "text",
        { section: "Data", span: 2 },
      ),
      f("jenisKelamin", "L/P", "select", {
        section: "Data",
        options: JK,
      }),
      f("tanggalLahir", "Tgl Lahir", "date", { section: "Data" }),
      f("tanggalUkur", "Tgl Pengukuran", "date", { section: "Data" }),
      f("umurBulan", "Umur (bulan)", "computed", { section: "Data" }),
      f("bb", "BB (Kg)", "number", { section: "Data", step: "0.1" }),
      f("tbLila", "TB (Cm) / LiLA (Cm)", "number", {
        section: "Data",
        step: "0.1",
      }),
      f("hb", "Hb (untuk Bumil Anemia)", "number", {
        section: "Data",
        step: "0.1",
      }),
      f("keterangan", "Ket.", "textarea", { section: "Data", span: 2 }),
    ],
  },
  {
    key: "laporan-bulanan",
    title: "Laporan Bulanan",
    shortTitle: "Laporan Bulanan",
    description:
      "Laporan Hasil Kegiatan Posyandu di wilayah Puskesmas Montong Betok, Kecamatan Montong Gading.",
    model: "laporanBulanan",
    orderBy: [{ createdAt: "desc" }],
    compute: () => ({}),
    tableColumns: ["bulanTahun", "tanggal", "dusun", "desa"],
    fields: [
      f("posyandu", "Posyandu", "text", { section: "Sampul" }),
      f("tanggal", "Tanggal Posyandu", "date", { section: "Sampul" }),
      f("dusun", "Dusun", "text", { section: "Sampul" }),
      f("desa", "Desa", "text", { section: "Sampul" }),
      f("bulanTahun", "Bulan / Tahun", "text", {
        section: "Sampul",
        placeholder: "contoh: November 2026",
        required: true,
      }),
      f("data", "Rincian laporan", "json", { hidden: true }),
    ],
  },
];

export const MODULE_MAP = new Map(MODULES.map((module) => [module.key, module]));

export function getModuleConfig(key: string): ModuleConfig | undefined {
  return MODULE_MAP.get(key);
}

export function getField(config: ModuleConfig, name: string) {
  return config.fields.find((field) => field.name === name);
}

/** Nilai tampilan untuk kolom tabel. */
export function displayValue(
  config: ModuleConfig,
  fieldName: string,
  record: RecordData,
): string {
  const field = getField(config, fieldName);
  const value = record[fieldName];

  if (field?.type === "date") {
    if (!value) return "—";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? "—"
      : new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date);
  }

  if (field?.type === "checkbox") {
    return value ? "✓" : "—";
  }

  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
