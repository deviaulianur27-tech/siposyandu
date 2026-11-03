export type UserRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | Date | null;
  createdAt: string | Date;
};

export type ApiError = { message?: string };
