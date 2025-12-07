import type { ProviderMap, ServiceMap } from "../../../types"
import { createBuilder } from "../../buillder";

export type ScheduleContext = {
    services: ServiceMap;
    providers: ProviderMap;
}

export type ScheduleHandler = (ctx: ScheduleContext) => Promise<void> | void

export type ScheduleConfig = {
    name: string;
    cronExpression: string;
    handler?: ScheduleHandler;
    runOnStartup?: boolean;
}

const defineScheduleBuilder = (config: ScheduleConfig) => {
    // @ts-ignore
    // TODO: Types korrigieren
    const base = createBuilder(config, (newConfig) => defineScheduleBuilder(cofig))

    return {
        ...base,
        _isSchedule: true,
        build: () => config,
        cron: (expression: string) => {
            return defineScheduleBuilder({ ...config, cronExpression: expression })
        },
        every: (interval: 'minute' | 'hour' | 'day') => {
            const map = {
                day: '0 0 * * *',
                hour: '0 * * * *',
                minute: '* * * * *'
            }
            return defineScheduleBuilder({ ...config, cronExpression: map[interval] })
        },
        handle: (handler: ScheduleHandler) => {
            return defineScheduleBuilder({ ...config, handler })
        }
    }
}

const defineSchedule = (name: string) => {
    return defineScheduleBuilder({
        cronExpression: '* * * * *',
        name
    })
}

export { defineSchedule }