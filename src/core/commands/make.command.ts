import { defineCommand } from "../factory/command"
import { dirname } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { file, write } from "bun"
import consola from "consola"
import { replaceStub, str } from "../utils/str"


const CONTROLLER_TEMPLATE = `
import { defineController } from 'oakbun'

export const {{name}}Controller = defineController('{{collection}}')
`

const SERVICE_TEMPLATE = `
import { defineService } from 'oakbun'

export const {{name}}Service = defineService('{{collection}}')
`

const ROUTE_TEMPLATE = `
import { defineRoute } from 'oakbun'
import { z } from 'zod'

export const {{name}}Route = defineRoute('{{collection}}')
    .validate({
        store: z.object({
            // TODO: Validation Rules
        })
    })
`

const TABLE_TEMPLATE = `
import { uuid } from "drizzle-orm/pg-core";
import { defineTable } from "oakbun/schema";

export const {{name}}Table = defineTable('{{collection}}').columns({
    id: uuid('id').primaryKey().defaultRandom(),
    // TODO: Add columns
}).timestamps().build();
`

const COMMAND_TEMPLATE = `
import { defineCommand } from 'oakbun'
import consola from 'consola'

defineCommand('{{signature}}', {
    description: 'TODO: Beschreibung hinzufügen',
    handle: async (args) => {
        consola.info('Befehl {{signature}} ausgeführt!')
    }
})
`

const PROVIDER_TEMPLATE = `i
mport { defineProvider } from 'oakbun'

export const {{name}}Provider = defineProvider('{{collection}}', {})
    .custom(({ config }) => {
        return {
            // TODO: Implement Provider Logic
        }
    })
`

const MIDDLEWARE_TEMPLATE = `
import { defineMiddleware } from 'oakbun'

export const {{name}}Middleware = defineMiddleware({
    name: '{{name}}',
    handler: async (c, next) => {
        await next()
    }
})
`

// --- HELPERS ---

const generateFile = async (path: string, content: string) => {
    const folder = dirname(path)
    await mkdir(folder, { recursive: true })

    const f = file(path)

    if (await f.exists()) {
        consola.warn(`Datei existiert bereits: ${path}`)
        return false
    }

    await write(path, content.trim())
    consola.success(`Erstellt: ${path}`)
    return true
}

const getNames = (arg: string) => {
    if (!arg) return null
    return {
        raw: arg,
        pascal: str.pascal(arg),
        camel: str.singular(arg).toLowerCase(),
        snake: str.tableize(arg),
        kebab: str.plural(arg).toLowerCase()
    }
}

const registerMakeCommands = () => {

    defineCommand('make:controller', {
        description: 'Erstelle einen OAK Controller',
        handle: async (args) => {
            const names = getNames(args[0]!)
            if (!names) return consola.error('Name fehlt!')

            await generateFile(
                `./src/api/${names.kebab}/controller/index.ts`,
                replaceStub(CONTROLLER_TEMPLATE, { collection: names.kebab, name: names.pascal })
            )
        }
    })

    defineCommand('make:service', {
        description: 'Erstelle einen OAK Service',
        handle: async (args) => {
            const names = getNames(args[0]!)
            if (!names) return consola.error('Name fehlt!')

            await generateFile(
                `./src/api/${names.kebab}/service/index.ts`,
                replaceStub(SERVICE_TEMPLATE, { collection: names.kebab, name: names.pascal })
            )
        }
    })

    defineCommand('make:route', {
        description: 'Erstelle einen OAK Route Endpunkt',
        handle: async (args) => {
            const names = getNames(args[0]!)
            if (!names) return consola.error('Name fehlt!')

            await generateFile(
                `./src/api/${names.kebab}/route/index.ts`,
                replaceStub(ROUTE_TEMPLATE, { collection: names.kebab, name: names.pascal })
            )
        }
    })

    defineCommand('make:table', {
        description: 'Erstelle ein OAK Datenbank-Schema',
        handle: async (args) => {
            const names = getNames(args[0]!)
            if (!names) return consola.error('Name fehlt!')

            await generateFile(
                `./src/database/schemas/${names.kebab}/index.ts`,
                replaceStub(TABLE_TEMPLATE, { collection: names.kebab, name: names.pascal })
            )
        }
    })

    defineCommand('make:module', {
        description: 'Erstelle Table, Service, Controller & Route gleichzeitig',
        handle: async (args) => {
            const name = args[0]
            if (!name) return consola.error('Name fehlt!')

            consola.info(`Generiere Module: ${name}`)

            const names = getNames(name)!;

            await generateFile(`./src/database/schemas/${names.kebab}/index.ts`, replaceStub(TABLE_TEMPLATE, { collection: names.kebab, name: names.pascal }))
            await generateFile(`./src/api/${names.kebab}/service/index.ts`, replaceStub(SERVICE_TEMPLATE, { collection: names.kebab, name: names.pascal }))
            await generateFile(`./src/api/${names.kebab}/controller/index.ts`, replaceStub(CONTROLLER_TEMPLATE, { collection: names.kebab, name: names.pascal }))
            await generateFile(`./src/api/${names.kebab}/route/index.ts`, replaceStub(ROUTE_TEMPLATE, { collection: names.kebab, name: names.pascal }))
        }
    })

    defineCommand('make:provider', {
        description: 'Erstelle einen OAK Provider',
        handle: async (args) => {
            const names = getNames(args[0]!)
            if (!names) return consola.error('Name fehlt!')

            await generateFile(
                `./src/providers/${names.kebab}.provider.ts`,
                replaceStub(PROVIDER_TEMPLATE, { collection: names.kebab, name: names.pascal })
            )
        }
    })

    defineCommand('make:middleware', {
        description: 'Erstelle eine OAK Middleware',
        handle: async (args) => {
            const names = getNames(args[0]!)
            if (!names) return consola.error('Name fehlt!')

            await generateFile(
                `./src/middleware/${names.camel}.ts`,
                replaceStub(MIDDLEWARE_TEMPLATE, { name: names.pascal })
            )
        }
    })

    defineCommand('make:command', {
        description: 'Erstellt einen neuen CLI Befehl (z.B. user:import)',
        handle: async (args) => {
            const signature = args[0]
            if (!signature) return consola.error('Bitte Signatur angeben! Bsp: user:import')

            const parts = signature.split(':')
            const filename = parts.pop()
            const directory = parts.join('/')
            const path = `./src/commands/${directory ? directory + '/' : ''}${filename}.ts`

            await generateFile(path, replaceStub(COMMAND_TEMPLATE, { signature }))
        }
    })

    defineCommand('make:example', {
        description: 'Generiert ein vollständiges Todo-Beispiel (Schema, API, Middleware)',
        handle: async () => {
            consola.start('Generiere Beispiel-Ressourcen...')

            const schemaContent = `
import { text, boolean, uuid } from "drizzle-orm/pg-core";
import { defineTable } from "oakbun/schema";

export const todoTable = defineTable('todo').columns({
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    done: boolean('done').default(false)
}).timestamps().build();
`
            await generateFile('./src/database/schemas/todo/index.ts', schemaContent)

            const middlewareContent = `
import { defineMiddleware } from 'oakbun'
import consola from 'consola'

export const exampleLoggerMiddleware = defineMiddleware({
    name: 'ExampleLogger',
    handler: async (c, next) => {
        consola.info('[Example Middleware] Zugriff auf Todo API')
        await next()
    }
})
`
            await generateFile('./src/middleware/example-logger.ts', middlewareContent)

            const serviceContent = `
import { defineService } from 'oakbun'
import { todoTable } from '../../../database/schemas/todo'

export const todoService = defineService('todo')
    .hooks({
        // Demo: Daten manipulieren bevor sie gespeichert werden
        beforeStore: async (data) => {
            // Titel trimmen
            if (typeof data.title === 'string') {
                data.title = data.title.trim()
            }
            return data
        }
    })
`
            await generateFile('./src/api/todo/service/index.ts', serviceContent)

            const controllerContent = `
import { defineController } from 'oakbun'

export const todoController = defineController('todo')
`
            await generateFile('./src/api/todo/controller/index.ts', controllerContent)

            const routeContent = `
import { defineRoute } from 'oakbun'
import { z } from 'zod'
import { exampleLoggerMiddleware } from '../../../middleware/example-logger'

export const todoRoute = defineRoute('todo')
    // Middleware einbinden
    .middleware([exampleLoggerMiddleware])
    // Validierung definieren
    .validate({
        store: z.object({
            title: z.string().min(3, "Der Titel muss mindestens 3 Zeichen lang sein"),
            description: z.string().optional(),
            done: z.boolean().optional()
        })
    })
`
            await generateFile('./src/api/todo/route/index.ts', routeContent)

            consola.success('Beispiel erfolgreich erstellt! 🚀')
            consola.box(
                'Nächste Schritte:\n\n' +
                '1. Datenbank aktualisieren:\n' +
                '   bunx oakbun db:push\n\n' +
                '2. Server starten:\n' +
                '   bun run dev\n\n' +
                '3. Testen:\n' +
                '   POST http://localhost:3000/api/todos'
            )
        }
    })
}

export { registerMakeCommands }