import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { loadConfig } from "../config";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

let dbPromise: Promise<Database> | undefined;

async function ensureSchema(db: Database): Promise<void> {
  await db.execute(sql`
    create table if not exists user_settings (
      telegram_user_id bigint primary key,
      anchor_date text not null,
      anchor_time varchar(5) not null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `);
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const connection = neon(loadConfig().databaseUrl);
      const db = drizzle(connection, { schema });
      await ensureSchema(db);
      return db;
    })();
  }

  return dbPromise;
}
