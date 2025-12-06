import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { file, write } from 'bun'
import consola from 'consola'
import pluralize from 'pluralize'

export const str = {
    // Macht "user_profile" -> "UserProfile" (PascalCase für Klassen/Typen)
    pascal: (word: string) => {
        return word.replace(/(^\w|\w)/g, (m) => m.replace(/_/, '').toUpperCase())
    },
    // Macht "drink" -> "drinks", "category" -> "categories"
    plural: (word: string) => pluralize(word),

    // Macht "drinks" -> "drink"
    singular: (word: string) => pluralize.singular(word),

    // Macht "UserProfile" -> "user_profile" (SnakeCase für DB Tabellen)
    tableize: (word: string) => {
        return pluralize(word.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase())
    },
}

export async function generateFile(path: string, content: string) {
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

export function replaceStub(
    template: string,
    replacements: Record<string, string>,
) {
    let result = template
    for (const [key, value] of Object.entries(replacements)) {
        result = result.replaceAll(`{{ ${key}}
        }`, value)
    }
    return result
}