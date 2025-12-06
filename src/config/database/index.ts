import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { DrizzleLogger } from "../../core/logger/drizzle.logger";

const client = new SQL(Bun.env.DATABASE_URL!)

export const db = drizzle({
    client,
    logger: new DrizzleLogger()
})
