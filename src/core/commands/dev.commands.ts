import { defineCommand } from "../factory/command";
import consola from 'consola'
import ora from 'ora'

export const registerDevCommands = () => {

    defineCommand('dev:server', {
        description: 'Startet Server im Watch-Mode (Hot Reload)',
        handle: async () => {
            consola.box('🚀  OAK DEV SERVER')

            const spinner = ora('Fahre System hoch...').start()


            const proc = Bun.spawn(['bun', '--hot', 'src/index.ts'], {
                env: { ...process.env, FORCE_COLOR: '1', NODE_ENV: 'development' },
                ipc: (message) => {

                    if (message === 'ready') {
                        spinner.succeed('Server läuft & lauscht!')
                    }
                },
                stdio: ['inherit', 'inherit', 'inherit'],

                onExit: () => {
                    if (spinner.isSpinning) {
                        spinner.fail('Server ist abgestürzt!')
                    }
                }
            })

            const handleSignal = async () => {
                if (spinner.isSpinning) spinner.stop()

                consola.info('\nBeende Dev Server...')
                proc.kill('SIGTERM')
                await proc.exited
                process.exit(0)
            }

            process.on('SIGINT', handleSignal)
            process.on('SIGTERM', handleSignal)

            await proc.exited
        },
    })

    defineCommand('dev:db', {
        description: 'Startet die Datenbank-Container (Docker)',
        handle: async (args) => {
            const mode = args[0] === 'stop' ? 'down' : 'up -d'

            consola.info(`Docker Compose: ${mode}...`)

            const proc = Bun.spawn(['docker-compose', ...mode.split(' ')], {
                stdio: ['inherit', 'inherit', 'inherit']
            })

            await proc.exited

            if (proc.exitCode === 0) {
                consola.success(args[0] === 'stop' ? 'Datenbank gestoppt.' : 'Datenbank läuft!')
            } else {
                consola.error('Fehler bei Docker Compose.')
            }
        }
    })

    defineCommand('dev:clean', {
        description: 'Löscht dist, cache und node_modules (Hard Reset)',
        handle: async () => {
            const spinner = ora('Putze das Haus...').start()

            await Bun.spawn(['rm', '-rf', 'dist', '.bun', 'tsconfig.tsbuildinfo']).exited

            await Bun.spawn(['rm', '-rf', 'node_modules']).exited

            spinner.succeed('Alles sauber! Bitte "bun install" ausführen.')
        }
    })
}