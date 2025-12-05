import type { Context } from "hono"
import type { PluginMap, ServiceHandlers, ServiceMap } from "../../../types"
import { Registry } from "../../registry"
import { Response } from "../../response"

export type RouteHandler = (c: Context) => Promise<Response | any>

export type BaseHandlers = Record<'index' | 'store' | 'show' | 'update' | 'destroy', RouteHandler>

export type ControllerContext = {
    services: ServiceMap;
    plugins: PluginMap
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
    )
}

const baseController = <S, I>(service: ServiceHandlers<S, I>): BaseHandlers => {
    return {
        destroy: async (c) => {
            const id = c.req.param('id')
            await service.destroy(id)
            return Response.success(c, null, 'Deleted successfully')
        },
        show: async (c) => { },
        index: async (c) => { },
        store: async (c) => { },
        update: async (c) => { }
    }
}

const defineControllerBuilder = () => {

}

const defineController = (collection: string) => {
    return defineControllerBuilder<BaseHandlers>({
        collection
    })
}

export { defineController }