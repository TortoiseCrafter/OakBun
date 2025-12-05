import { text } from "drizzle-orm/pg-core";
import { defineTable } from "../../core/factory/table";

const coreSessionTable = defineTable('session').columns({
    id: text('id').primaryKey(),
    ipAddress: text('ip_address'),
    token: text('text').notNull().unique(),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull()
}).timestamps();

export { coreSessionTable }