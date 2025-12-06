import consola from "consola";
import type { GlobalEvent, GlobalEventHandler } from "../../types";

const listeners: GlobalEventHandler[] = []

const Registry = {
    Commands: new Map(),
    Controller: new Map(),
    Middlewares: new Map(),
    Plugins: new Map(),
    Providers: new Map(),
    Routes: new Map(),
    Services: new Map(),
    Tables: new Map(),
    GlobalHooks: {
        emit: async (collection: string, event: GlobalEvent, data: any) => {
            for (const fn of listeners) {
                try {
                    const result = fn(collection, event, data)
                    if (result instanceof Promise) result.catch(console.error)
                } catch (e) {
                    consola.error('[GlobalHook Error]', e)
                }
            }
        },
        on: (handler: GlobalEventHandler) => {
            listeners.push(handler)
        }
    },
    Auth: null as any,
}

export { Registry }