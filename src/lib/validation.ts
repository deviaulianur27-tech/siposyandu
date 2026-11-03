import { z } from "zod";
import { ROLES } from "@/lib/roles";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter")
  .max(30, "Username maksimal 30 karakter")
  .regex(
    /^[a-z0-9._-]+$/,
    "Username hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau strip",
  )
  .toLowerCase();

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password wajib diisi"),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter"),
  username: usernameSchema,
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
  role: z.enum(ROLES),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80).optional(),
  username: usernameSchema.optional(),
  email: z.string().trim().email("Format email tidak valid").toLowerCase().optional(),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter")
    .optional()
    .or(z.literal("")),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
