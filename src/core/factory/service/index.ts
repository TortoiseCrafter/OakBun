import type { PgTable } from "drizzle-orm/pg-core";
import { Registry } from "../../registry";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import type { ModelRegistry, PluginMap, ProviderMap, ServiceHandlers, ServiceMap } from "../../../types";
import { Column, eq } from "drizzle-orm";
import { createBuilder, type Builder } from "../../buillder";
import consola from "consola";

const context = {
    plugins: {},
    providers: new Proxy(
        {},
        {
            get: (_target, prop) => Registry.Providers.get(prop)
        }
    ),
    services: new Proxy(
        {},
        {
            get: (_target, prop) => Registry.Services.get(prop)
        }
    )
}

type ServiceHooks<S, I> = {
    beforeStore?: (data: I) => Promise<I> | I
    afterStore?: (item: S) => Promise<void> | void
    beforeUpdate?: (id: string, data: Partial<I>) => Promise<Partial<I>> | Partial<I>
    afterUpdate?: (id: string, item: S) => Promise<void> | void
    beforeDestroy?: (id: string) => Promise<void> | void
    afterDestroy?: (id: string) => Promise<void> | void
}

type ServiceContext = {
    services: ServiceMap;
    plugins: PluginMap;
    providers: ProviderMap
}

type HooksFactory<S, I> = (ctx: ServiceContext) => ServiceHooks<S, I>

interface TableWithId {
    id: Column
}

type ServiceConfig<S, I> = {
    collection: string;
    handlers?: Partial<ServiceHandlers<S, I>>
    hooks?: ServiceHooks<S, I> | HooksFactory<S, I>
}

interface IServiceBuilder<S, I, E = {}> extends Builder<ServiceConfig<S, I>, IServiceBuilder<S, I, E>> {
    _isService: boolean;
    build: (config: { table: PgTable, db: BunSQLDatabase }) => ServiceHandlers<S, I> & E
    custom: <NewE>(handlerFactory: (ctx: ServiceContext) => NewE & ThisType<ServiceHandlers<S, I> & E>) => IServiceBuilder<S, I, E & NewE>
    hooks: (hooksFactory: ServiceHooks<S, I> | HooksFactory<S, I>) => IServiceBuilder<S, I, E>
}

const baseService = <S, I>(
    table: PgTable,
    db: BunSQLDatabase,
    hooks: ServiceHooks<S, I>,
    collectionName: string
): ServiceHandlers<S, I> => {
    return {
        index: async (options) => {
            const limit = options?.limit || 10;
            const page = options?.page || 1;
            const offset = (page - 1) * limit;
            const data = await db.select().from(table).limit(limit).offset(offset)

            return data as S[]
        },
        show: async (id) => {
            const result = await db.select().from(table).where(eq((table as unknown as TableWithId).id, id))

            return (result[0] as S) || null
        },
        store: async (data) => {
            let payload = data

            if (hooks.beforeStore) {
                payload = await hooks.beforeStore(payload)
            }

            const result = await db.insert(table).values(payload as any).returning()
            const item = result[0] as S

            if (hooks.afterStore) {
                await hooks.afterStore(item)
            }

            Registry.GlobalHooks.emit(collectionName, 'stored', item)

            return item
        },
        update: async (id, data) => {
            let payload = data

            if (hooks.beforeUpdate) {
                payload = await hooks.beforeUpdate(id, payload)
            }

            const result = await db.update(table).set(payload).where(eq((table as unknown as TableWithId).id, id))
            const item = result[0] as S

            if (hooks.afterUpdate) {
                await hooks.afterUpdate(id, item)
            }

            Registry.GlobalHooks.emit(collectionName, 'updated', item)

            return item
        },
        destroy: async (id) => {
            if (hooks.beforeDestroy) {
                await hooks.beforeDestroy(id)
            }

            await db.delete(table).where(eq((table as unknown as TableWithId).id, id))

            if (hooks.afterDestroy) {
                await hooks.afterDestroy(id)
            }

            Registry.GlobalHooks.emit(collectionName, 'destroyed', id)
        }
    }
}

const defineServiceBuilder = <S, I, E = {}>(config: ServiceConfig<S, I>): IServiceBuilder<S, I, E> => {
    const base = createBuilder(config, (newConfig) => defineServiceBuilder<S, I, E>(newConfig))

    return {
        ...base,
        _isService: true,
        build: ({ table, db }) => {
            let resolvedHooks: ServiceHooks<S, I> = {}

            if (typeof config.hooks === 'function') {
                resolvedHooks = config.hooks(context)
            } else if (config.hooks) {
                resolvedHooks = config.hooks
            }

            if (!table) {
                consola.warn(`Service '${config.collection}' läuft ohne Datenbank-Tabelle.`)
            }

            const _base = table ? baseService<S, I>(table, db, resolvedHooks, config.collection) : {}

            return { ..._base, ...config.handlers } as ServiceHandlers<S, I> & E
        },
        custom: <NewE>(handlerFactory: any) => {
            let handlers = handlerFactory

            if (typeof handlerFactory === 'function') {
                handlers = handlerFactory(context)
            }

            return defineServiceBuilder<S, I, E & NewE>({
                ...config,
                handlers: { ...config.handlers, ...handlers }
            })
        },
        hooks: (hooksFactory: ServiceHooks<S, I> | HooksFactory<S, I>) => {
            const newHooksFactory: HooksFactory<S, I> = (ctx) => {
                let oldHooks: ServiceHooks<S, I> = {}

                if (typeof config.hooks === 'function') {
                    oldHooks = config.hooks(ctx)
                } else if (config.hooks) {
                    oldHooks = config.hooks
                }

                let newHooks: ServiceHooks<S, I> = {}
                if (typeof hooksFactory === 'function') {
                    newHooks = hooksFactory(ctx)
                } else {
                    newHooks = hooksFactory
                }

                return mergeServiceHooks(oldHooks, newHooks)
            }

            return defineServiceBuilder<S, I, E>({
                ...config,
                hooks: newHooksFactory
            })
        }
    }
}

const defineService = <K extends keyof ModelRegistry | (string & {})>(collection: K) => {
    type S = K extends keyof ModelRegistry ? ModelRegistry[K]['select'] : unknown
    type I = K extends keyof ModelRegistry ? ModelRegistry[K]['insert'] : unknown

    return defineServiceBuilder<S, I, {}>({
        collection,
        handlers: {}
    })
}

const pipeAsync = <T>(fn1?: (arg: T) => Promise<T> | T, fn2?: (arg: T) => Promise<T> | T) => {
    return async (arg: T) => {
        let res = arg

        if (fn1) res = await fn1(res)
        if (fn2) res = await fn2(res)

        return res
    }
}

const sequenceAsync = <T>(fn1?: (arg: T) => Promise<void> | void, fn2?: (arg: T) => Promise<void> | void) => {
    return async (arg: T) => {
        if (fn1) await fn1(arg)
        if (fn2) await fn2(arg)
    }
}

const mergeServiceHooks = <S, I>(existing: ServiceHooks<S, I> = {}, incoming: ServiceHooks<S, I> = {}): ServiceHooks<S, I> => {
    return {
        afterDestroy: sequenceAsync(existing.afterDestroy, incoming.afterDestroy),
        afterStore: sequenceAsync(existing.afterStore, incoming.afterStore),
        afterUpdate: async (id, item) => {
            if (existing.afterUpdate) await existing.afterUpdate(id, item)
            if (incoming.afterUpdate) await incoming.afterUpdate(id, item)
        },
        beforeDestroy: sequenceAsync(
            existing.beforeDestroy,
            incoming.beforeDestroy
        ),
        beforeStore: pipeAsync(existing.beforeStore, incoming.beforeStore),
        beforeUpdate: async (id, data) => {
            let d = data

            if (existing.beforeUpdate) d = await existing.beforeUpdate(id, d)
            if (incoming.beforeUpdate) d = await incoming.beforeUpdate(id, d)
            return d
        }
    }
}

export { defineService }