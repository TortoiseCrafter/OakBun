// tsdown.schema.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
    format: ['esm', 'cjs'],
    entry: {
        // Nur das Schema bauen
        "schema/index": "src/schema/index.ts"
    },
    dts: true,
    // WICHTIG: clean: false, damit wir den vorherigen App-Build nicht löschen
    clean: false,
    target: 'esnext',
    outDir: './dist',
    // Hier KEIN 'bun' als external listen (es sollte gar nicht erst drin sein!)
    external: ['drizzle-orm']
})