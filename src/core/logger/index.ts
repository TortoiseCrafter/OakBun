import { createConsola } from "consola";

const logger = createConsola({
    defaults: {
        tag: 'OAK Bun',
    },
    formatOptions: {
        colors: true,
        compact: false,
        date: true,
        json: Bun.env.NODE_ENV === 'production'
    },
    level: Bun.env.NODE_ENV === 'production' ? 3 : 4
})

const createScope = (scope: string) => {
    return logger.withTag(scope)
}

export { createScope }