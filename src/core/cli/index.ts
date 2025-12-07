import { Glob } from "bun"
import consola from "consola"
import path from 'node:path'

import {
    databaseDrop,
    databaseMigrate,
    databaseGenerate,
    databasePush,
    databaseStudio
} from '../commands/db.commands'

const BootConsole = async (dir?: string) => {

    databaseDrop.build()
    databaseMigrate.build()
    databaseGenerate.build()
    databasePush.build()
    databaseStudio.build()

    await loadCommandsFrom(dir ?? './src/commands')
}

const loadCommandsFrom = async (dir: string): Promise<void> => {
    try {
        const glob = new Glob('**/.*ts')
        const absolutDir = path.join(process.cwd(), dir)

        for await (const file of glob.scan({ cwd: absolutDir })) {
            const _module = import(path.join(absolutDir, file)) as any

            _module.build()
        }
    } catch (error) {
        consola.warn('Keine Custom Commands')
    }
}

export { BootConsole }