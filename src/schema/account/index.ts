import { text, timestamp } from "drizzle-orm/pg-core";
import { defineTable } from "../../core/factory/table";

const coreAccountTable = defineTable('account').columns({
    id: text('id').primaryKey(),
    idToken: text('id_token'),
    accessToken: text('access_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    accountId: text('account_id').notNull(),
    password: text('password'),
    providerId: text('provider_id').notNull(),
    refreshToken: text('refresh_token'),
    scope: text('scope'),
    userId: text('user_id').notNull()
}).timestamps()

export { coreAccountTable }