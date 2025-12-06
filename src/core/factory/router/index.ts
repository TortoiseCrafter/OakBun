import type { Handler, MiddlewareHandler } from "hono";
import type { ControllerMap, PluginMap, ServiceMap } from "../../../types"
import type { BaseHandlers, RouteHandler } from "../controller";
import { Registry } from "../../registry";
import type { Factory } from "hono/factory";
import { str } from "../../utils/str";

export type CustomRoutes = {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    handler: RouteHandler
    middleware?: MiddlewareHandler[]
}

export type RouteContext = {
    services: ServiceMap;
    controller: ControllerMap;
    plugins: PluginMap

    route: <P extends string>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        path: P,
        handler: Handler<any, P>,
        middleware?: MiddlewareHandler[]
    ) => CustomRoutes
}

export type ScopedMiddleware = {
    handler: MiddlewareHandler;
    includeInCustom: boolean
}

export type RouteConfig = {
    collection: string;
    basePath?: string;
    middleware: ScopedMiddleware[];
    customRoutes: CustomRoutes[]
}

export type CustomRouteFactory = (ctx: RouteContext) => CustomRoutes[]

const context: RouteContext = {
    controller: new Proxy(
        {},
        {
            get: (_target, prop) => {
                return Registry.Controller.get(prop)
            }
        }
    ) as unknown as ControllerMap,
    plugins: {},
    route: (method, path, handler, middleware) => ({
        handler: handler as unknown as RouteHandler,
        method,
        middleware,
        path
    }),
    services: new Proxy(
        {},
        {
            get: (_target, prop) => {
                return Registry.Services.get(prop)
            }
        }
    )
}

const defineRouteBuilder = (config: RouteConfig) => {
    return {
        _isRoute: true,
        basePath: (path: string) => {
            return defineRouteBuilder({
                ...config,
                basePath: path
            })
        },
        build: ({ controller, factory }: { controller?: BaseHandlers, factory?: Factory } = {}) => {
            const _app = config.basePath ? factory?.createApp().basePath(config.basePath) : factory?.createApp()

            const pluralCollection = str.plural(config.collection)

            const crudMiddleware = config.middleware.map((m) => m.handler)

            const customGlobalMiddleware = config.middleware.filter((m) => m.includeInCustom).map((m) => m.handler)

            if (config.customRoutes.length) {
                config.customRoutes.forEach((route) => {
                    _app?.on(
                        route.method,
                        `/${pluralCollection}${route.path}`,
                        ...customGlobalMiddleware,
                        ...(route.middleware || []),
                        route.handler
                    )
                })
            }

            if (controller) {
                _app?.get(`/${pluralCollection}`, ...crudMiddleware, controller.index)
                _app?.post(`/${pluralCollection}`, ...crudMiddleware, controller.store)
                _app?.get(`/${pluralCollection}/:id`, ...crudMiddleware, controller.show)
                _app?.put(`/${pluralCollection}/:id`, ...crudMiddleware, controller.update)
                _app?.delete(`/${pluralCollection}/:id`, ...crudMiddleware, controller.destroy)
            }

            return _app
        },
        custom: (routesOrFactory: CustomRoutes[] | CustomRouteFactory) => {
            let newRoutes: CustomRoutes[] = []

            if (typeof routesOrFactory === 'function') {
                newRoutes = routesOrFactory(context)
            } else {
                newRoutes = routesOrFactory
            }

            return defineRouteBuilder({
                ...config,
                customRoutes: [...(config.customRoutes || []), ...newRoutes]
            })
        },
        getCollection: () => config.collection,
        getConfig: () => config,
        middleware: (mw: MiddlewareHandler[], includeInCustom: boolean = true) => {
            const newScopedMiddlewarer: ScopedMiddleware[] = mw.map((handler) => ({
                handler,
                includeInCustom
            }))

            return defineRouteBuilder({
                ...config,
                middleware: [...config.middleware, ...newScopedMiddlewarer]
            })
        }
    }
}

const defineRoute = (collection: string) => {
    return defineRouteBuilder({
        basePath: '/api',
        collection,
        customRoutes: [],
        middleware: []
    })
}

export { defineRoute }