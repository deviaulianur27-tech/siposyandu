const BASE = "http://127.0.0.1:3100";

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

async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const raw = res.headers.getSetCookie?.() ?? [];
  return {
    res,
    cookie: raw.length ? raw[0].split(";")[0] : null,
  };
}

async function api(cookie, path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

await waitReady();

const kader = await login("kader", "Kader123!");
check("Login kader = 200", kader.res.status === 200, `status ${kader.res.status}`);

console.log("\n=== Halaman modul ===");
const pages = [
  ["/posyandu/pendaftaran", "Buku Pendaftaran"],
  ["/posyandu/ibu-hamil", "Kartu Ibu Hamil"],
  ["/posyandu/remaja", "Kartu Remaja"],
  ["/posyandu/dewasa", "Kartu Dewasa"],
  ["/posyandu/lansia", "Kartu Lansia"],
  ["/posyandu/laporan-nama", "Daftar Nama untuk Laporan"],
  ["/posyandu/laporan-bulanan", "Laporan Bulanan"],
  ["/posyandu/rekap", "Rekap Kunjungan"],
];
for (const [path, text] of pages) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie: kader.cookie },
    redirect: "manual",
  });
  const html = await res.text();
  check(
    `${path} = 200 dan memuat "${text}"`,
    res.status === 200 && html.includes(text),
    `status ${res.status}`,
  );
}

console.log("\n=== API tanpa login ===");
const noAuth = await api(null, "/api/posyandu/pendaftaran");
check("GET modul tanpa login = 401", noAuth.res.status === 401, `status ${noAuth.res.status}`);

console.log("\n=== Buku Pendaftaran ===");
const pendaftaran = await api(kader.cookie, "/api/posyandu/pendaftaran");
check(
  "GET pendaftaran memuat 21 sasaran awal",
  pendaftaran.res.status === 200 && pendaftaran.body.records?.length >= 21,
  `${pendaftaran.body.records?.length ?? 0} baris`,
);

console.log("\n=== Kartu Ibu Hamil (computed) ===");
const ibu = await api(kader.cookie, "/api/posyandu/ibu-hamil", {
  method: "POST",
  body: JSON.stringify({
    nama: "Test Ibu Hamil",
    lila: "22",
    sistole: "145",
    diastole: "95",
    tbcBatuk: "Ya",
    tbcDemam: "Ya",
    tbcBbTurun: "Tidak",
    tbcKontak: "Tidak",
  }),
});
check("POST ibu hamil = 201", ibu.res.status === 201, `status ${ibu.res.status}`);
check("hasilLiLA = KEK (<23,5)", ibu.body.record?.hasilLila === "KEK (<23,5)", ibu.body.record?.hasilLila);
check("hasilTD = Tinggi", ibu.body.record?.hasilTd === "Tinggi", ibu.body.record?.hasilTd);
check(
  "hasil skrining TBC = Rujuk Puskesmas",
  ibu.body.record?.hasilTbc === "Rujuk Puskesmas",
  ibu.body.record?.hasilTbc,
);

console.log("\n=== Kartu Remaja (umur + TD) ===");
const remaja = await api(kader.cookie, "/api/posyandu/remaja", {
  method: "POST",
  body: JSON.stringify({
    nama: "Test Remaja",
    tanggalLahir: "2009-03-15",
    jadwalPosyandu: "2026-11-02",
    sistole: "110",
    diastole: "70",
  }),
});
check("POST remaja = 201", remaja.res.status === 201, `status ${remaja.res.status}`);
check("umur = 17", remaja.body.record?.umur === 17, String(remaja.body.record?.umur));
check("hasilTD = Normal", remaja.body.record?.hasilTd === "Normal", remaja.body.record?.hasilTd);

console.log("\n=== Kartu Dewasa (IMT + PUMA + TBC) ===");
const dewasa = await api(kader.cookie, "/api/posyandu/dewasa", {
  method: "POST",
  body: JSON.stringify({
    nama: "Test Dewasa",
    tanggalLahir: "1980-02-01",
    tanggalKunjungan: "2026-11-02",
    jenisKelamin: "P",
    bb: "60",
    tb: "155",
    sistole: "125",
    diastole: "80",
    skorMerokok: "0",
    napasPendek: "Tidak",
    dahak: "Tidak",
    batuk: "Tidak",
    spirometri: "Tidak",
    tbcBatuk: "Ya",
    tbcDemam: "Ya",
    tbcBbTurun: "Tidak",
    tbcKontak: "Tidak",
  }),
});
check("POST dewasa = 201", dewasa.res.status === 201, `status ${dewasa.res.status}`);
check("umur = 46", dewasa.body.record?.umur === 46, String(dewasa.body.record?.umur));
check("IMT = 25", dewasa.body.record?.imt === 25, String(dewasa.body.record?.imt));
check("status IMT = Normal", dewasa.body.record?.statusImt === "Normal", dewasa.body.record?.statusImt);
check("skor PUMA = 0", dewasa.body.record?.skorPuma === 0, String(dewasa.body.record?.skorPuma));
check("rujuk PUMA kosong", dewasa.body.record?.rujukPuma === "", dewasa.body.record?.rujukPuma);
check(
  "skrining TBC dewasa = Rujuk Puskesmas",
  dewasa.body.record?.hasilTbc === "Rujuk Puskesmas",
  dewasa.body.record?.hasilTbc,
);

console.log("\n=== Kartu Lansia (SKILAS) ===");
const lansia = await api(kader.cookie, "/api/posyandu/lansia", {
  method: "POST",
  body: JSON.stringify({
    nama: "Test Lansia",
    tanggalLahir: "1960-05-10",
    tanggalKunjungan: "2026-11-02",
    lila: "20",
    sistole: "135",
    diastole: "85",
  }),
});
check("POST lansia = 201", lansia.res.status === 201, `status ${lansia.res.status}`);
check("umur = 66", lansia.body.record?.umur === 66, String(lansia.body.record?.umur));
check("LiLA < 21 = Ya", lansia.body.record?.skilasLila === "Ya", lansia.body.record?.skilasLila);
check(
  "hasil SKILAS = Rujuk Puskesmas",
  lansia.body.record?.hasilSkilas === "Rujuk Puskesmas",
  lansia.body.record?.hasilSkilas,
);

console.log("\n=== Daftar Nama Laporan (umur bulan) ===");
const kasus = await api(kader.cookie, "/api/posyandu/laporan-nama", {
  method: "POST",
  body: JSON.stringify({
    kategori: "BGM",
    nama: "Test BGM",
    tanggalLahir: "2025-01-10",
    tanggalUkur: "2026-11-02",
    bb: "8.5",
    tbLila: "75",
  }),
});
check("POST daftar nama = 201", kasus.res.status === 201, `status ${kasus.res.status}`);
check("umur bulan = 21", kasus.body.record?.umurBulan === 21, String(kasus.body.record?.umurBulan));

console.log("\n=== Laporan Bulanan ===");
const tanpaBulan = await api(kader.cookie, "/api/posyandu/laporan-bulanan", {
  method: "POST",
  body: JSON.stringify({ posyandu: "Pede Seneng" }),
});
check("Laporan tanpa bulan/tahun = 400", tanpaBulan.res.status === 400, `status ${tanpaBulan.res.status}`);

const laporan = await api(kader.cookie, "/api/posyandu/laporan-bulanan", {
  method: "POST",
  body: JSON.stringify({
    bulanTahun: "Test November 2026",
    posyandu: "Pede Seneng",
    data: {
      sasaran: { "0-5 Bln": { l: "2", p: "1" } },
      ds: { LANSIA: { d: "10", s: "20" } },
    },
  }),
});
check("POST laporan bulanan = 201", laporan.res.status === 201, `status ${laporan.res.status}`);
check(
  "Data JSON laporan tersimpan",
  laporan.body.record?.data?.sasaran?.["0-5 Bln"]?.l === "2",
  JSON.stringify(laporan.body.record?.data?.sasaran ?? null),
);

console.log("\n=== PATCH + DELETE ===");
const created = [
  ["ibu-hamil", ibu.body.record?.id],
  ["remaja", remaja.body.record?.id],
  ["dewasa", dewasa.body.record?.id],
  ["lansia", lansia.body.record?.id],
  ["laporan-nama", kasus.body.record?.id],
];

for (const [module, id] of created) {
  if (!id) {
    check(`PATCH ${module}`, false, "id tidak ada");
    continue;
  }
  const patched = await api(kader.cookie, `/api/posyandu/${module}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      nama: `Test ${module} (diubah)`,
      kategori: module === "laporan-nama" ? "BGM" : undefined,
    }),
  });
  check(
    `PATCH ${module} = 200`,
    patched.res.status === 200 && patched.body.record?.nama === `Test ${module} (diubah)`,
    `status ${patched.res.status}`,
  );

  const deleted = await api(kader.cookie, `/api/posyandu/${module}/${id}`, {
    method: "DELETE",
  });
  check(`DELETE ${module} = 200`, deleted.res.status === 200, `status ${deleted.res.status}`);
}

if (laporan.body.record?.id) {
  const deleted = await api(
    kader.cookie,
    `/api/posyandu/laporan-bulanan/${laporan.body.record.id}`,
    { method: "DELETE" },
  );
  check("DELETE laporan bulanan = 200", deleted.res.status === 200, `status ${deleted.res.status}`);
}

const after = await api(kader.cookie, "/api/posyandu/pendaftaran");
check(
  "Data awal tetap utuh setelah uji",
  after.body.records?.length >= 21,
  `${after.body.records?.length ?? 0} baris`,
);

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
