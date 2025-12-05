
export interface ModuleConfig {
    name: string;
    services?: Record<string, any>;
    controllers?: Record<string, any>;
    providers?: Record<string, any>;
    imports?: any[];
}
