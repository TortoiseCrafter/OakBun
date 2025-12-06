import type { Context } from "hono"
import type { PluginMap, ServiceHandlers, ServiceMap } from "../../../types"
import { Registry } from "../../registry"
import { Response } from "../../response"
import { createBuilder, type Builder } from "../../buillder"
import consola from "consola"

export type RouteHandler = (c: Context) => Promise<Response | any>

export type BaseHandlers = Record<'index' | 'store' | 'show' | 'update' | 'destroy', RouteHandler>

export type ControllerContext = {
    services: ServiceMap;
    plugins: PluginMap
}

export type ControllerConfig = {
    collection: string;
    handlers?: ControllerHandlers
}

export type ControllerHandlers = Partial<BaseHandlers> & Record<string, RouteHandler>

interface IControllerBuilder<TConfig extends ControllerConfig, THandlers = BaseHandlers> extends Builder<TConfig, IControllerBuilder<TConfig, THandlers>> {
    _isController: boolean;
    build(args: { service: any }): THandlers
    custom<NewH extends ControllerHandlers>(handlerFactory: (context: ControllerContext) => NewH): IControllerBuilder<TConfig, THandlers & NewH>
    custom<NewH extends ControllerHandlers>(handlers: NewH): IControllerBuilder<TConfig, THandlers & NewH>
}

const context: ControllerContext = {
    plugins: {},
    services: new Proxy(
        {},
        {
            get: (_target, prop) => {
                return Registry.Services.get(prop)
            }
        }
    ) as unknown as ServiceMap
}

const baseController = <S, I>(service: ServiceHandlers<S, I>): BaseHandlers => {
    return {
        destroy: async (c) => {
            const id = c.req.param('id')
            await service.destroy(id)
            return Response.success(c, null, 'Deleted successfully')
        },
        show: async (c) => {
            const id = c.req.param('id')
            const item = await service.show(id)
            if (!item) return Response.error(c, 'Ressource not found', 404)
            return Response.success(c, item)
        },
        index: async (c) => {
            const page = Number(c.req.param('page') || 1)
            const limit = Number(c.req.param('limit') || 20)
            const data = await service.index({ limit, page })
            return Response.success(c, data, 'List fetched', 200, {
                limit,
                page
            })
        },
        store: async (c) => {
            const body = await c.req.json()
            const created = await service.store(body)
            return Response.success(c, created, 'Stored successfully', 201)
        },
        update: async (c) => {
            const id = c.req.param('id')
            const body = await c.req.json()
            const updated = await service.update(id, body)
            return Response.success(c, updated, 'Updated successfully')
        }
    }
}

const defineControllerBuilder = <THandlers = BaseHandlers>(config: ControllerConfig): IControllerBuilder<ControllerConfig, THandlers> => {
    const base = createBuilder(config, (newConfig) => defineControllerBuilder(newConfig))

    return {
        ...base,
        _isController: true,
        build: ({ service }: any) => {

            if (!service) {
                consola.error('No Service found!')
            }

            const _baseController = baseController(service)

            return {
                ..._baseController,
                ...config.handlers
            } as unknown as THandlers
        },
        custom: <NewH>(handlerFactory: any) => {

            const handlers = typeof handlerFactory === 'function' ? handlerFactory(context) : handlerFactory

            return defineControllerBuilder<THandlers & NewH>({
                ...config,
                handlers: { ...config.handlers, ...handlers }
            })
        }
    } as unknown as IControllerBuilder<ControllerConfig, THandlers>
}

const defineController = (collection: string) => {
    return defineControllerBuilder<BaseHandlers>({
        collection
    })
}

export { defineController }