-- CreateTable
CREATE TABLE "Sasaran" (
    "id" TEXT NOT NULL,
    "no" INTEGER,
    "nama" TEXT NOT NULL,
    "noKk" TEXT,
    "jenisKelamin" TEXT,
    "alamat" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "kategoriLansia" BOOLEAN NOT NULL DEFAULT false,
    "kategoriPtm" BOOLEAN NOT NULL DEFAULT false,
    "kategoriRemaja" BOOLEAN NOT NULL DEFAULT false,
    "kategoriBalita" BOOLEAN NOT NULL DEFAULT false,
    "noHp" TEXT,
    "kehadiran" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sasaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KunjunganIbuHamil" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nik" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "namaSuami" TEXT,
    "alamat" TEXT,
    "noHp" TEXT,
    "dusun" TEXT,
    "desa" TEXT,
    "kecamatan" TEXT,
    "hamilAnakKe" INTEGER,
    "jarakAnak" TEXT,
    "beratBadanAwal" DOUBLE PRECISION,
    "tinggiBadan" DOUBLE PRECISION,
    "tanggalKunjungan" TIMESTAMP(3),
    "usiaKehamilan" INTEGER,
    "bb" DOUBLE PRECISION,
    "bbKurva" TEXT,
    "lila" DOUBLE PRECISION,
    "hasilLila" TEXT,
    "sistole" INTEGER,
    "diastole" INTEGER,
    "hasilTd" TEXT,
    "tbcBatuk" TEXT,
    "tbcDemam" TEXT,
    "tbcBbTurun" TEXT,
    "tbcKontak" TEXT,
    "hasilTbc" TEXT,
    "tabletDarah" TEXT,
    "jumlahTablet" INTEGER,
    "mtKek" TEXT,
    "kondisiMt" TEXT,
    "kelasIbuHamil" TEXT,
    "edukasi" TEXT,
    "rujuk" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KunjunganIbuHamil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KunjunganRemaja" (
    "id" TEXT NOT NULL,
    "noUrutReg" TEXT,
    "noUrutKk" TEXT,
    "nama" TEXT NOT NULL,
    "nik" TEXT,
    "noJkn" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" TEXT,
    "pendidikan" TEXT,
    "namaKk" TEXT,
    "jadwalPosyandu" TIMESTAMP(3),
    "umur" INTEGER,
    "bb" DOUBLE PRECISION,
    "tb" DOUBLE PRECISION,
    "lila" DOUBLE PRECISION,
    "lingkarPerut" DOUBLE PRECISION,
    "sistole" INTEGER,
    "diastole" INTEGER,
    "hasilTd" TEXT,
    "hbAnemia" TEXT,
    "feRematri" TEXT,
    "psq" TEXT,
    "sdq" TEXT,
    "heeadsss" TEXT,
    "konseling" TEXT,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KunjunganRemaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KunjunganDewasa" (
    "id" TEXT NOT NULL,
    "noKartu" TEXT,
    "nama" TEXT NOT NULL,
    "nik" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" TEXT,
    "alamat" TEXT,
    "noHp" TEXT,
    "statusPerkawinan" TEXT,
    "pekerjaan" TEXT,
    "dusun" TEXT,
    "desa" TEXT,
    "kecamatan" TEXT,
    "riwayatKeluarga" TEXT,
    "riwayatDiri" TEXT,
    "perilakuBerisiko" TEXT,
    "tanggalKunjungan" TIMESTAMP(3),
    "umur" INTEGER,
    "bb" DOUBLE PRECISION,
    "tb" DOUBLE PRECISION,
    "imt" DOUBLE PRECISION,
    "statusImt" TEXT,
    "lingkarPerut" DOUBLE PRECISION,
    "lila" DOUBLE PRECISION,
    "sistole" INTEGER,
    "diastole" INTEGER,
    "hasilTd" TEXT,
    "gulaDarah" DOUBLE PRECISION,
    "hasilGulaDarah" TEXT,
    "mataKanan" TEXT,
    "mataKiri" TEXT,
    "telingaKanan" TEXT,
    "telingaKiri" TEXT,
    "skorJk" INTEGER,
    "skorUsia" INTEGER,
    "skorMerokok" INTEGER,
    "napasPendek" TEXT,
    "dahak" TEXT,
    "batuk" TEXT,
    "spirometri" TEXT,
    "skorPuma" INTEGER,
    "rujukPuma" TEXT,
    "tbcBatuk" TEXT,
    "tbcDemam" TEXT,
    "tbcBbTurun" TEXT,
    "tbcKontak" TEXT,
    "hasilTbc" TEXT,
    "alatKontrasepsi" TEXT,
    "edukasi" TEXT,
    "rujuk" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KunjunganDewasa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KunjunganLansia" (
    "id" TEXT NOT NULL,
    "noKartu" TEXT,
    "nama" TEXT NOT NULL,
    "nik" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" TEXT,
    "alamat" TEXT,
    "noHp" TEXT,
    "statusPerkawinan" TEXT,
    "pekerjaan" TEXT,
    "dusun" TEXT,
    "desa" TEXT,
    "kecamatan" TEXT,
    "tanggalKunjungan" TIMESTAMP(3),
    "umur" INTEGER,
    "bb" DOUBLE PRECISION,
    "tb" DOUBLE PRECISION,
    "lingkarPerut" DOUBLE PRECISION,
    "lila" DOUBLE PRECISION,
    "sistole" INTEGER,
    "diastole" INTEGER,
    "hasilTd" TEXT,
    "gulaDarah" DOUBLE PRECISION,
    "skilasOrientasi" TEXT,
    "skilasMengulang" TEXT,
    "skilasBerdiri" TEXT,
    "skilasBbTurun" TEXT,
    "skilasNafsuMakan" TEXT,
    "skilasLila" TEXT,
    "skilasMata" TEXT,
    "skilasTesMelihat" TEXT,
    "skilasTesBisik" TEXT,
    "skilasSedih" TEXT,
    "skilasMinat" TEXT,
    "hasilSkilas" TEXT,
    "imunisasiCovid" TEXT,
    "edukasi" TEXT,
    "rujuk" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KunjunganLansia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaporanKasus" (
    "id" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "namaOrangTua" TEXT,
    "jenisKelamin" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "tanggalUkur" TIMESTAMP(3),
    "umurBulan" INTEGER,
    "bb" DOUBLE PRECISION,
    "tbLila" DOUBLE PRECISION,
    "hb" DOUBLE PRECISION,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaporanKasus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaporanBulanan" (
    "id" TEXT NOT NULL,
    "posyandu" TEXT NOT NULL DEFAULT 'Pede Seneng',
    "tanggal" TIMESTAMP(3),
    "dusun" TEXT,
    "desa" TEXT,
    "bulanTahun" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaporanBulanan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sasaran_nama_idx" ON "Sasaran"("nama");

-- CreateIndex
CREATE INDEX "Sasaran_kategoriBalita_idx" ON "Sasaran"("kategoriBalita");

-- CreateIndex
CREATE INDEX "Sasaran_kategoriLansia_idx" ON "Sasaran"("kategoriLansia");

-- CreateIndex
CREATE INDEX "KunjunganIbuHamil_nama_idx" ON "KunjunganIbuHamil"("nama");

-- CreateIndex
CREATE INDEX "KunjunganIbuHamil_tanggalKunjungan_idx" ON "KunjunganIbuHamil"("tanggalKunjungan");

-- CreateIndex
CREATE INDEX "KunjunganRemaja_nama_idx" ON "KunjunganRemaja"("nama");

-- CreateIndex
CREATE INDEX "KunjunganRemaja_jadwalPosyandu_idx" ON "KunjunganRemaja"("jadwalPosyandu");

-- CreateIndex
CREATE INDEX "KunjunganDewasa_nama_idx" ON "KunjunganDewasa"("nama");

-- CreateIndex
CREATE INDEX "KunjunganDewasa_tanggalKunjungan_idx" ON "KunjunganDewasa"("tanggalKunjungan");

-- CreateIndex
CREATE INDEX "KunjunganLansia_nama_idx" ON "KunjunganLansia"("nama");

-- CreateIndex
CREATE INDEX "KunjunganLansia_tanggalKunjungan_idx" ON "KunjunganLansia"("tanggalKunjungan");

-- CreateIndex
CREATE INDEX "LaporanKasus_kategori_idx" ON "LaporanKasus"("kategori");

-- CreateIndex
CREATE INDEX "LaporanKasus_nama_idx" ON "LaporanKasus"("nama");

-- CreateIndex
CREATE INDEX "LaporanBulanan_bulanTahun_idx" ON "LaporanBulanan"("bulanTahun");
