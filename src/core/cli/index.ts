import { Glob } from "bun"
import consola from "consola"
import path from 'node:path'
import '../commands/db.commands'

const BootConsole = async (dir?: string) => {
    await loadCommandsFrom(dir ?? './src/commands')
}

const loadCommandsFrom = async (dir: string): Promise<void> => {
    const glob = new Glob('**/.*ts')
    const absolutDir = path.join(process.cwd(), dir)

    if (!absolutDir) {
        consola.warn('Keine Custom Commands')
        return
    }

    for await (const file of glob.scan({ cwd: absolutDir })) {
        await import(path.join(absolutDir, file))
    }
}

export { BootConsole }