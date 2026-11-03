-- Tambah username unik untuk login.
-- Kolom dibuat nullable dulu, diisi dari bagian lokal email, lalu diwajibkan.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = lower(split_part("email", '@', 1))
WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
