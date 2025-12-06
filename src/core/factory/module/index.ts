
export interface ModuleConfig {
    name: string;
    services?: Record<string, any>;
    controllers?: Record<string, any>;
    providers?: Record<string, any>;
    imports?: any[];
}


const defineModule = (config: ModuleConfig) => {
    return {
        ...config,
        _isModule: true,
        build: (ctx: any) => {
            return config
        }
    }
}

export { defineModule }