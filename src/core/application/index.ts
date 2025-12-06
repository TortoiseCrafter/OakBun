import ora from "ora";
import { Registry } from "../registry";
import { Glob } from "bun";
import path from 'node:path'
import { getTableConfig } from "drizzle-orm/pg-core";
import { db } from "../../config/database";
import consola from "consola";
import { httpLogger } from "../middleware/logger";
import { contextMiddleware } from "../middleware/context";
import { createScope } from "../logger";
import { HTTPException } from "hono/http-exception";
import { Response } from "../response";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { showRoutes } from "hono/dev";
import { systemRoutes } from "../system/routes";
import type { PluginConfig } from "../factory/plugin";
import { factory } from "../factory/app";
import { betterAuth } from "better-auth";
import { baseAuthOptions } from "../../config/auth";
import type { Hono } from "hono";

const appLogger = createScope('APP')

async function defineApplication(config?: () => {
    plugins?: PluginConfig[],
    log?: {
        showRoutes?: boolean
    },
    auth?: any
}): Promise<{ app: Hono }> {
    // 1. Config laden
    const _config = config ? config() : {}

    // 2 Bootstrap Phase (Infrastruktur laden)
    // Hier werden Tabellen, Services, und Plugins (Schema/Provider) geladen.
    const spinner = ora("Fahre System hoch...").start()

    await bootstrapApp({
        plugins: _config.plugins
    })

    if (_config?.auth) {
        Registry.Auth = _config.auth
    } else {
        Registry.Auth = betterAuth(baseAuthOptions)
    }

    spinner.succeed('Core System & Plugins geladen!')

    const app = factory.createApp()
    app.use(httpLogger)
    app.use('*', contextMiddleware)

    const _controllerGlob = new Glob('src/api/**/controller/**/*.{ts,js}')
    const _routerGlob = new Glob('src/api/**/route/**/*.{ts,js}')

    spinner.start('Lade HTTP Layer')

    // 3. Controller Laden
    for await (const file of _controllerGlob.scan()) {
        const _absolutePath = path.join(process.cwd(), file)
        const _imported = await import(_absolutePath)
        const _items = Object.values(_imported)

        for (const { build, getCollection } of _items as any) {
            const _service = Registry.Services.get(getCollection())
            const _controller = build({ service: _service })
            Registry.Controller.set(getCollection(), _controller)
        }
    }

    // 4. Routen Laden
    for await (const file of _routerGlob.scan()) {
        const _absolutePath = path.join(process.cwd(), file)
        const _imported = await import(_absolutePath)
        const _items = Object.values(_imported)

        for (const { build, getCollection } of _items as any) {
            const _controller = Registry.Controller.get(getCollection())
            const _route = build({ controller: _controller, factory })
            Registry.Routes.set(getCollection(), _route)
        }
    }

    // 5. Plugin Setup
    if (_config.plugins) {
        for (const plugin of _config.plugins) {
            if (plugin.setup) {
                appLogger.info(`Setup Plugin: ${plugin.name}`)

                await plugin.setup({
                    app,
                    providers: new Proxy(
                        {},
                        { get: (_, p) => Registry.Providers.get(p as string) },
                    ) as any,
                    services: new Proxy(
                        {},
                        { get: (_, p) => Registry.Services.get(p as string) },
                    ) as any,
                    registry: Registry,
                    db
                })
            }
        }
    }

    // 6. API Routen registrieren
    Registry.Routes.forEach((value) => {
        app.route('/', value)
    })

    // 7. System Routen registrieren
    // TODO: System Routen registrieren
    // @ts-ignore
    app.route('/', systemRoutes.build({ factory }))

    // 8. Socket
    // TODO: Socket

    spinner.succeed('HTTP Server bereit!')

    if (process.send) {
        process.send('ready')
    }

    app.onError((err, c) => {
        console.log(err)
        if (err instanceof HTTPException) {
            return Response.error(c, err.message, err.status as ContentfulStatusCode)
        }
        appLogger.error(err)
        return Response.error(c, 'Internal Server Error', 500, Bun.env.NODE_ENV === 'development' ? err.stack : undefined)
    })

    app.notFound((c) => Response.error(c, 'Route not found', 404))

    const shutdown = async (signal: string) => {
        appLogger.info(`[${signal}]: Fahre System herunter...`)

        try {
            appLogger.debug('Schließe Datenbank-Verbindungen...')
            // TODO: DB Verbindung beenden

            appLogger.success('Datenbank getrennt')
        } catch (error) {
            appLogger.error('Fehler beim DB Shutdown: ', error)
        }

        appLogger.success('Bye Bye!')
        process.exit(0)
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))

    if (_config.log?.showRoutes) {
        appLogger.debug(showRoutes(app))
    }

    return {
        app,
    }
}

async function bootstrapApp(config: { plugins?: PluginConfig[] } = {}) {
    // Wenn schon geladen, abbrechen (Singleton Pattern)
    if (Registry.Services.size > 0) return

    // 1. Tabellen laden
    const _tableGlob = new Glob('src/database/schemas/**/*.{ts,js}')
    for await (const file of _tableGlob.scan()) {
        const _absolutePath = path.join(process.cwd(), file)
        const _module = await import(_absolutePath)

        Object.values(_module).forEach((item) => {
            const config = getTableConfig(item as any)
            if (config) Registry.Tables.set(config.name, item)
        })
    }

    // 2. Services laden
    const _serviceGlob = new Glob('src/api/**/service/**/*.{ts,js}')
    for await (const file of _serviceGlob.scan()) {
        const _absolutePath = path.join(process.cwd(), file)
        const _imported = await import(_absolutePath)

        Object.values(_imported).forEach((item) => {
            // TODO: Types verbessern
            // @ts-ignore
            if (item.build && item.getCollection) {
                // @ts-ignore
                const _table = Registry.Tables.get(item.getCollection())
                // @ts-ignore
                const _service = item.build({ db, table: _table })
                // @ts-ignore
                Registry.Services.set(item.getCollection(), _service)
            }
        })
    }

    // 3. Plugins laden

    if (config.plugins) {
        for (const plugin of config.plugins) {
            consola.info(`Lade Plugin: ${plugin.name}`);

            // A. Schema injizieren
            if (plugin.schema) {
                Object.entries(plugin.schema).forEach(([key, table]) => {
                    if (Registry.Tables.has(key))
                        consola.warn(`Schema Kollison: ${key}`)

                    Registry.Tables.set(key, table)
                })
            }

            // B. Provider injizieren
            if (plugin.providers) {
                Object.entries(plugin.providers).forEach(([key, provider]) => {
                    Registry.Providers.set(key, provider)
                })
            }

            // C. Services injizieren
            if (plugin.services) {
                Object.entries(plugin.services).forEach(([key, serviceBuilder]) => {
                    const _table = Registry.Tables.get(key)
                    const _service = serviceBuilder.build({
                        db,
                        table: _table
                    })

                    Registry.Services.set(key, _service)
                })
            }
        }
    }
}

export { defineApplication, bootstrapApp }