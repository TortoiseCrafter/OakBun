import { createBuilder, type Builder } from "../../buillder"

export interface ProviderConfig<TConfig = any> {
    name: string;
    config?: TConfig
}

export interface IProviderBuilder<TConfig = any> extends Builder<ProviderConfig<TConfig>, IProviderBuilder<TConfig>> {
    _isProvider: boolean;
    custom<NewHandlers>(handlerFactory: (context: { config: TConfig }) => NewHandlers): NewHandlers
}

const defineProviderBuilder = <TConfig = any>(name: string, initialConfig?: TConfig): IProviderBuilder<TConfig> => {
    const base = createBuilder({ config: initialConfig, name } as any, (newConfig) => defineProviderBuilder(newConfig.name, newConfig.collection) as any)

    return {
        ...base,
        _isProvider: true,
        custom: (handlerFactory: any) => {
            const handlers = handlerFactory({ config: initialConfig })
            return handlers
        }
    } as unknown as IProviderBuilder<TConfig>
}

const defineProvider = <TConfig = any>(name: string, initialConfig?: TConfig) => {
    return defineProviderBuilder<TConfig>(name, initialConfig)
}

export { defineProvider }