import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";

const AUTH_COOKIE_NAME = "control_session";
const publicRoutes = ["/login", "/api/auth/login", "/api/auth/logout", "/api/health"];

async function isValidToken(token: string) {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const rows = await sql.query(
      `
        select 1
        from neon_auth.session
        where token = $1
          and "expiresAt" > now()
        limit 1
      `,
      [token]
    );

    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token || !(await isValidToken(token))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
