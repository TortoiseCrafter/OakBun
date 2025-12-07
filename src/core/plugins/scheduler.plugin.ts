import { Cron } from "croner"
import { definePlugin } from "../factory/plugin"
import consola from "consola"
import { Glob } from "bun"
import path from 'node:path'

const activeJobs = new Map<string, Cron>()

const schedulerPlugin = definePlugin({
    name: 'Task Scheduler',
    slug: 'scheduler',
    setup: async ({ services, providers }) => {
        consola.info('Lade Scheduled Task')

        const glob = new Glob('src/schedules/**/*.{ts,js}')

        for await (const file of glob.scan()) {
            const absolutePath = path.join(process.cwd(), file)
            const module = await import(absolutePath)

            Object.values(module).forEach((item: any) => {
                if (item._isSchedule && item.build) {
                    const config = item.build()

                    if (!config.handler) return

                    consola.info(`Job registriert: ${config.name} [${config.cronExpression}]`)

                    const job = new Cron(config.cronExpression, async () => {
                        consola.log(`Running Job: ${config.name}`)

                        try {
                            await config.handler({ services, providers })
                        } catch (error) {
                            consola.error(`Error in Job ${config.name}:`, error)
                        }
                    })

                    activeJobs.set(config.name, job)
                }
            })
        }
    }
})

export { schedulerPlugin }