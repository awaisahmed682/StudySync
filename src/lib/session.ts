import "server-only";

import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  userId: string;
  email: string;
  expiresAt: Date;
};

const secretKey = process.env.SESSION_SECRET || "dev-only-insecure-secret";
const encodedKey = new TextEncoder().encode(secretKey);
const COOKIE_NAME = "session";

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      expiresAt: new Date((payload.exp ?? 0) * 1000),
    };
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: string, email: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, email, expiresAt });
  return {
    name: COOKIE_NAME,
    value: session,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      expires: expiresAt,
    },
  };
}

export const SESSION_COOKIE = COOKIE_NAME;
