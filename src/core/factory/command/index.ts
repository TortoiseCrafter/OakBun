import type { Subprocess } from "bun";
import { Registry } from "../../registry";
import consola from "consola";
import { styleText } from 'node:util'

export type CommandOptions = {
    description: string;
    handle: (args: string[]) => Promise<void | Subprocess>
}

const defineCommand = (signature: string, option: CommandOptions) => {

    return {
        build: () => {
            if (Registry.Commands.has(signature)) {
                consola.warn(`Warnung: Befehl ${signature} wurde überschrieben`)
            }

            Registry.Commands.set(signature, option)
        }
    }
}

const runCommand = async () => {
    const [commandName, ...args] = Bun.argv.slice(2);

    if (!commandName) {
        printHelp()
        return;
    }

    const action = Registry.Commands.get(commandName)

    if (action) {
        await action.handle(args)
    } else {
        consola.warn(`Befehl '${commandName}' nicht gefunden.`)
    }
}

const printHelp = () => {
    consola.box('OakBun CLI v0.0.1')

    console.log(styleText('yellow', '\nVerfügbare Befehle:\n'))

    const commands = Array.from(Registry.Commands.entries())
    const maxKeyLength = Math.max(...commands.map(([key]) => key.length))
    const sortedCommands = commands.sort((a, b) => a[0].localeCompare(b[0]))

    let lastNameSpace: string | undefined = ''

    for (const [name, cmd] of sortedCommands) {
        const namespace = name.includes(':') ? name.split(':')[0] : 'global'

        if (namespace !== lastNameSpace && lastNameSpace !== '') {
            console.log('')
        }
        lastNameSpace = namespace

        const paddedName = name.padEnd(maxKeyLength + 4, ' ')
        const description = cmd.description || 'Keine Beschreibung'
        console.log(
            ` ${styleText('green', paddedName)} ${styleText('gray', description)}`
        )
    }

    console.log('')
}

export { defineCommand, runCommand }