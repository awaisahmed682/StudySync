"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations";
import { SESSION_COOKIE, createSessionCookie } from "@/lib/session";

export type AuthState = { error?: string; message?: string } | undefined;

export async function register(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });
  await prisma.userSettings.create({ data: { userId: user.id } });

  const sessionCookie = await createSessionCookie(user.id, user.email);
  (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
  redirect("/");
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Invalid email or password." };

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return { error: "Invalid email or password." };

  const valid = await compare(password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  const sessionCookie = await createSessionCookie(user.id, user.email);
  (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}