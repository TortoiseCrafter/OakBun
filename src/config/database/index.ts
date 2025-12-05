import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";

const client = new SQL(Bun.env.DATABASE_URL!)

export const db = drizzle({
    client,
    // TODO: Logger für drizzle noch einbauen
})