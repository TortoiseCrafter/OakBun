import { boolean, text, uuid } from "drizzle-orm/pg-core";
import { defineTable } from "../../core/factory/table";

const coreUserTable = defineTable('user').columns({
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image')
}).timestamps()

export { coreUserTable }