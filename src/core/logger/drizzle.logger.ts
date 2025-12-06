import type { Logger } from "drizzle-orm";
import { createScope } from ".";

const dbLog = createScope('Database')

class DrizzleLogger implements Logger {
    logQuery(query: string, params: unknown[]): void {
        if (process.env.NODE_ENV === 'production') return

        dbLog.info(query)

        if (params.length > 0) {
            dbLog.debug(`Params: ${JSON.stringify(params)}`)
        }
    }
}

export { DrizzleLogger }