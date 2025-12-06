import { jsonb, text } from "drizzle-orm/pg-core";
import { defineTable } from "../../core/factory/table";

const coreAuditTable = defineTable('oak_audit_log').columns({
    id: text('id').primaryKey(),
    userId: text('user_id'),
    action: text('action').notNull(),
    collection: text('collection').notNull(),
    payload: jsonb('payload'),
    recordId: text('record_id').notNull()
}).timestamps()

export { coreAuditTable }