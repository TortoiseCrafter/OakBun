import consola from "consola"
import { coreAuditTable } from "../../schema"
import { definePlugin } from "../factory"
import { currentUser } from "../store"

type AuditConfig = {
    exclude?: string[]
}

const auditPlugin = (config: AuditConfig = {}) => definePlugin({
    name: 'Audit Logger',
    slug: 'audit',
    schema: {
        oak_audit_log: coreAuditTable.build()
    },
    setup: ({ registry, db }) => {
        consola.info('Audit Log aktiv');

        registry.GlobalHooks.on(async (collection, event, data) => {
            if (collection === 'oak_audit_log') return;
            if (config.exclude?.includes(collection)) return

            const user = currentUser()
            const userId = user?.id ?? 'system'

            let action = 'UNKNOWN'
            let recordId = 'unknown'

            if (data && typeof data === 'object' && 'id' in data) {
                recordId = String(data.id)
            } else if (event === 'destroyed' && data.id) {
                recordId = String(data.id)
            }

            switch (event) {
                case 'stored': action = 'STORED'; break;
                case 'updated': action = 'UPDATE'; break;
                case 'destroyed': action = 'DESTROY'; break;
            }

            db.insert(coreAuditTable.build()).values({
                collection,
                recordId,
                action,
                userId,
                payload: event === 'destroyed' ? null : data
            }).catch(err => consola.error('Audit Error', err))
        })
    }
})

export { auditPlugin }