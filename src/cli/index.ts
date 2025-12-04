#!/usr/bin/env bun

async function main() {
    console.log("🚀 Meine super CLI startet...");

    // Hier kommt deine Logik hin (z.B. Argumente parsen)
    const args = Bun.argv.slice(2);
    console.log(`Argumente empfangen: ${args.join(', ')}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});