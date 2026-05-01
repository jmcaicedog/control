import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const timestamp = new Date().toISOString();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      {
        status: "error",
        timestamp,
        checks: {
          env: { DATABASE_URL: false },
          database: false,
          authSeed: false,
        },
      },
      { status: 500 }
    );
  }

  try {
    const sql = neon(databaseUrl);
    await sql.query("select 1");

    const seedRows = await sql.query(
      `
        select count(*)::int as total
        from neon_auth.account a
        join neon_auth."user" u on u.id = a."userId"
        where lower(u.email) = lower($1)
          and a."providerId" = 'credential'
          and a.password is not null
      `,
      ["jcaicedev@gmail.com"]
    );

    const seeded = Number(seedRows[0]?.total ?? 0) > 0;

    return NextResponse.json(
      {
        status: "ok",
        timestamp,
        checks: {
          env: { DATABASE_URL: true },
          database: true,
          authSeed: seeded,
        },
      },
      { status: seeded ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        timestamp,
        checks: {
          env: { DATABASE_URL: true },
          database: false,
          authSeed: false,
        },
      },
      { status: 500 }
    );
  }
}
