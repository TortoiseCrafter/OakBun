import { defineConfig } from 'tsdown'

export default defineConfig({
    format: ['esm'],
    entry: {
        "index": "src/index.ts",
        "cli/index": "src/cli/index.ts",
        "core/index": "src/core/index.ts",
        "schema/index": "src/schema/index.ts"
    },
    dts: true,
    clean: true,
    target: 'esnext',
    outDir: './dist'
})