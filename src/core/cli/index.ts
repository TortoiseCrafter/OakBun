import { Glob } from "bun"
import consola from "consola"
import path from 'node:path'

const BootConsole = async (dir: string = './src/commands') => {
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