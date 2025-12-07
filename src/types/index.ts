export type ServiceMap = {}
export type ProviderMap = {
    webhook: typeof import('../core/provider/webhook.provider').webhookProvider
}
export type PluginMap = {}
export type ControllerMap = {}
export type ModelRegistry = {}

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