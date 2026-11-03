import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      name: "Administrator Posyandu",
      username: "admin",
      email: "admin@siposyandu.id",
      password: "Admin123!",
      role: "ADMIN",
    },
    {
      name: "Kader Posyandu",
      username: "kader",
      email: "kader@siposyandu.id",
      password: "Kader123!",
      role: "KADER",
    },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        name: user.name,
        username: user.username,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
    console.log(`✓ ${user.role.padEnd(5)} ${user.username} / ${user.password}`);
  }

  // 21 sasaran awal dari sheet "Buku Pendaftaran".
  const sasaran = [
    { nama: "Alifa Eliana", alamat: "Talun", noHp: "085975165903", kategoriBalita: true },
    { nama: "M. Aqil Syibani", alamat: "Beleng", noHp: "087735602185", kategoriBalita: true },
    { nama: "M. Alfan Ramsani", alamat: "Beleng", kategoriBalita: true },
    { nama: "Arsyla Fadila", kategoriBalita: true },
    { nama: "Aira Nashita Sashana", alamat: "Beleng", kategoriBalita: true },
    { nama: "Anindya Zea Fadila", kategoriBalita: true },
    { nama: "IQ. Sartim", alamat: "Talun", kategoriLansia: true },
    { nama: "Imah", alamat: "Talun", kategoriPtm: true },
    { nama: "BQ. Hanifa Sari", alamat: "Talun" },
    { nama: "Nikmah", alamat: "Talun", kategoriPtm: true },
    { nama: "L. Tegar", alamat: "Talun", kategoriBalita: true },
    { nama: "Iswari", alamat: "Talun", kategoriPtm: true },
    { nama: "M. Ravardan", alamat: "Beleng", kategoriBalita: true },
    { nama: "Aira Sulisfia", alamat: "Beleng", kategoriBalita: true },
    { nama: "Zuriati", alamat: "Beleng", kategoriPtm: true },
    { nama: "IQ. Kartijah" },
    { nama: "Zea Almaira" },
    { nama: "Husmiati" },
    { nama: "Abdurahman" },
    { nama: "Rihadatul Aisi" },
    { nama: "Sirejun" },
  ];

  for (const [index, item] of sasaran.entries()) {
    const existing = await prisma.sasaran.findFirst({
      where: { nama: item.nama },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.sasaran.create({
      data: { no: index + 1, ...item, kehadiran: {} },
    });
  }
  console.log(`✓ ${sasaran.length} sasaran awal (Buku Pendaftaran)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
