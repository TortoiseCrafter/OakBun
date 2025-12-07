// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
    format: ['esm', 'cjs'],
    entry: {
        "index": "src/index.ts",
        "cli/index": "src/cli/index.ts",
        "plugins/index": "src/plugins/index.ts"
    },
    dts: true,
    clean: true, // Dies löscht dist am Anfang, das ist gut
    target: 'esnext',
    outDir: './dist',
    external: ['bun', 'drizzle-orm', 'hono', 'drizzle-kit']
})