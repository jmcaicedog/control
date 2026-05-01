import "dotenv/config";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "@/lib/auth";

async function run() {
  const email = "jcaicedev@gmail.com".toLowerCase();
  const password = process.env.INITIAL_USER_PASSWORD ?? "Control2026!";
  const name = process.env.INITIAL_USER_NAME ?? "Juan Manuel";
  const sql = neon(process.env.DATABASE_URL || "");
  const passwordHash = await hashPassword(password);

  const neonUsers = await sql.query(
    `select id::text as id, email, name from neon_auth."user" where lower(email) = lower($1) limit 1`,
    [email]
  );
  const existingNeonUser = neonUsers[0] as { id: string; email: string; name: string } | undefined;
  const userId = existingNeonUser?.id ?? randomUUID();

  if (!existingNeonUser) {
    await sql.query(
      `
        insert into neon_auth."user"
          (id, name, email, "emailVerified", "createdAt", "updatedAt")
        values
          ($1::uuid, $2, $3, true, now(), now())
      `,
      [userId, name, email]
    );
  } else {
    await sql.query(
      `
        update neon_auth."user"
        set name = $2,
            email = $3,
            "updatedAt" = now()
        where id = $1::uuid
      `,
      [userId, name, email]
    );
  }

  const accounts = await sql.query(
    `
      select id::text as id
      from neon_auth.account
      where "userId" = $1::uuid
        and "providerId" = 'credential'
      limit 1
    `,
    [userId]
  );

  if (accounts.length === 0) {
    await sql.query(
      `
        insert into neon_auth.account
          ("accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        values
          ($1, 'credential', $2::uuid, $3, now(), now())
      `,
      [email, userId, passwordHash]
    );
  } else {
    await sql.query(
      `
        update neon_auth.account
        set password = $2,
            "accountId" = $3,
            "updatedAt" = now()
        where id = $1::uuid
      `,
      [accounts[0].id, passwordHash, email]
    );
  }

  console.log(`Usuario inicial sincronizado en neon_auth: ${email}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
