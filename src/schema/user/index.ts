import { boolean, text } from "drizzle-orm/pg-core";
import { defineTable } from "../../core/factory/table";

const coreUserTable = defineTable('user').columns({
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image')
}).timestamps()

export { coreUserTable }