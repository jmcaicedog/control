import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";

const AUTH_COOKIE_NAME = "control_session";
const SESSION_TTL_DAYS = 30;

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

function getSqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return neon(url);
}

export async function hashPassword(rawPassword: string) {
  return bcrypt.hash(rawPassword, 12);
}

export async function verifyPassword(rawPassword: string, hash: string) {
  return bcrypt.compare(rawPassword, hash);
}

async function getSessionUserByToken(token: string): Promise<AuthUser | null> {
  const sql = getSqlClient();
  const rows = await sql.query(
    `
      select
        u.id::text as id,
        u.email,
        u.name
      from neon_auth.session s
      join neon_auth."user" u on u.id = s."userId"
      where s.token = $1
        and s."expiresAt" > now()
      limit 1
    `,
    [token]
  );

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return getSessionUserByToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
  });
}

export async function clearSessionCookie() {
  const sql = getSqlClient();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    await sql.query(`delete from neon_auth.session where token = $1`, [token]);
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  const sql = getSqlClient();
  const rows = await sql.query(
    `
      select
        u.id::text as id,
        u.email,
        u.name,
        a.password
      from neon_auth."user" u
      join neon_auth.account a on a."userId" = u.id
      where lower(u.email) = lower($1)
        and a.password is not null
      order by a."updatedAt" desc
      limit 1
    `,
    [email]
  );

  const user = rows[0] as (AuthUser & { password: string | null }) | undefined;

  if (!user) {
    return null;
  }

  const valid = user.password ? await verifyPassword(password, user.password) : false;
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const sql = getSqlClient();
  const token = randomBytes(32).toString("hex");

  await sql.query(
    `
      insert into neon_auth.session
        (token, "userId", "expiresAt", "createdAt", "updatedAt", "ipAddress", "userAgent")
      values
        ($1, $2::uuid, now() + interval '30 days', now(), now(), $3, $4)
    `,
    [token, userId, ipAddress ?? null, userAgent ?? null]
  );

  return token;
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return getSessionUserByToken(token);
}

export const authCookieName = AUTH_COOKIE_NAME;
