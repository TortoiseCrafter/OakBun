export type Builder<T, S> = {
    getConfig: () => T;
    getCollection: () => string;
    _update: (updates: Partial<T>) => S

}

const createBuilder = <T extends { collection: string }, S>(config: T, _constructor: (newConfig: T) => S): Builder<T, S> => {
    return {
        _update: (updates: Partial<T>): S => {
            return _constructor({ ...config, ...updates })
        },
        getCollection: () => config.collection,
        getConfig: () => config
    }
}

export { createBuilder }