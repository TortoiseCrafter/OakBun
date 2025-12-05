import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database";

const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg'
    })
})

export { auth }