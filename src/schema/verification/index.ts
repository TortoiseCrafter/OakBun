import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { defineTable } from "../../core/factory/table";

const coreVerificationTable = defineTable('verification').columns({
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    value: text('value').notNull()
}).timestamps()

export { coreVerificationTable }