import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appUsers } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

async function run() {
  const email = "jcaicedev@gmail.com";
  const password = process.env.INITIAL_USER_PASSWORD ?? "Control2026!";
  const name = process.env.INITIAL_USER_NAME ?? "Juan Manuel";

  const [existing] = await db.select().from(appUsers).where(eq(appUsers.email, email)).limit(1);

  if (existing) {
    console.log(`Seed omitido: ${email} ya existe`);
    return;
  }

  await db.insert(appUsers).values({
    id: randomUUID(),
    email,
    name,
    passwordHash: await hashPassword(password),
  });

  console.log(`Usuario inicial creado: ${email}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
