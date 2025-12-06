import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database";

export const baseAuthOptions = {
    database: drizzleAdapter(db, {
        provider: 'pg'
    }),
    emailAndPassword: {
        enabled: true
    }
};

export type OakAuthOptions = typeof baseAuthOptions;