import { AsyncLocalStorage } from 'node:async_hooks'

export type AppContext = {
    user: { id: string; email: string } | null;
    requestId: string;
}

const store = new AsyncLocalStorage<AppContext>()

const runInContext = <T>(ctx: AppContext, fn: () => T) => {
    return store.run(ctx, fn)
}

const currentUser = () => {
    const _store = store.getStore()
    return _store?.user ?? null
}

const currenRequestId = () => {
    const _store = store.getStore()
    return _store?.requestId
}

export {
    runInContext,
    currenRequestId,
    currentUser
}