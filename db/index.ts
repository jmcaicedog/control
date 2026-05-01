import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/db/schema";

const client = neon(process.env.DATABASE_URL ?? "postgresql://invalid:invalid@localhost:5432/invalid");

export const db = drizzle({ client, schema });
