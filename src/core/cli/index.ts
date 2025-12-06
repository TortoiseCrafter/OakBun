import { Glob } from "bun"
import path from 'node:path'

const BootConsole = async (dir?: string) => {
    await loadCommandsFrom(dir ?? './src/commands')
}

const loadCommandsFrom = async (dir: string): Promise<void> => {
    const glob = new Glob('**/.*ts')
    const absolutDir = path.join(process.cwd(), dir)

    for await (const file of glob.scan({ cwd: absolutDir })) {
        await import(path.join(absolutDir, file))
    }
}

export { BootConsole }