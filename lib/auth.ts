import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { appUsers } from "@/db/schema";

const AUTH_COOKIE_NAME = "control_session";
const encoder = new TextEncoder();

type SessionPayload = {
  sub: string;
  email: string;
  name: string;
};

function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }
  return encoder.encode(secret);
}

export async function hashPassword(rawPassword: string) {
  return bcrypt.hash(rawPassword, 12);
}

export async function verifyPassword(rawPassword: string, hash: string) {
  return bcrypt.compare(rawPassword, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload?.sub) {
    return null;
  }

  const [user] = await db
    .select({
      id: appUsers.id,
      email: appUsers.email,
      name: appUsers.name,
    })
    .from(appUsers)
    .where(and(eq(appUsers.id, payload.sub), eq(appUsers.email, payload.email)))
    .limit(1);

  return user ?? null;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function authenticate(email: string, password: string) {
  const [user] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload?.sub) {
    return null;
  }

  const [user] = await db
    .select({
      id: appUsers.id,
      email: appUsers.email,
      name: appUsers.name,
    })
    .from(appUsers)
    .where(and(eq(appUsers.id, payload.sub), eq(appUsers.email, payload.email)))
    .limit(1);

  return user ?? null;
}

export const authCookieName = AUTH_COOKIE_NAME;
