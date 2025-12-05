import type { PgTable } from "drizzle-orm/pg-core";
import type { Hono } from "hono";

export type PluginConfig = {
    name: string;
    slug?: string;
    schema?: Record<string, PgTable>;
    services?: Record<string, any>;
    providers?: Record<string, any>;

    setup?: (context: {
        app: Hono;
        services: ServiceMap
        providers: ProviderMap
    }) => Promise<void> | void
}

export type ServiceMap = {}
export type ProviderMap = {}
export type PluginMap = {}

export type GlobalEvent = 'stored' | 'updated' | 'destroyed';
export type GlobalEventHandler = (
    collection: string,
    event: GlobalEvent,
    data: any
) => Promise<void> | void

export type ServiceOptions = {
    limit?: number;
    page?: number;
    sort?: string;
}

export type ServiceHandlers<S, I> = {
    index: (options?: ServiceOptions) => Promise<S[]>
    store: (data: I) => Promise<S>
    show: (id: string) => Promise<S | null>
    update: (id: string, data: Partial<I>) => Promise<S>
    destroy: (id: string) => Promise<void>
    [key: string]: (...agrs: any[]) => Promise<any>
}

export type ServiceHooks<S, I> = {
    beforeStore?: (data: I) => Promise<I> | I
    afterStore?: (item: S) => Promise<void> | void
    beforeUpdate?: (id: string, data: Partial<I>) => Promise<Partial<I>> | Partial<I>
    afterUpdate?: (id: string, item: S) => Promise<void> | void
    beforeDestroy?: (id: string) => Promise<void> | void
    afterDestroy?: (id: string) => Promise<void> | void
}