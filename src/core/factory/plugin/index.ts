import type { PgTable } from "drizzle-orm/pg-core";
import type { Hono } from "hono";
import type { ProviderMap, ServiceMap } from "../../../types";
import type { Registry } from "../../registry";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";

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
        registry: typeof Registry
        db: BunSQLDatabase
    }) => Promise<void> | void
}

const definePlugin = (config: PluginConfig) => {
    return config
}

export { definePlugin }