import { migrate } from "drizzle-orm/bun-sql/migrator";
import consola from "consola";
import path from "node:path";
import { spawn } from "bun";
import { defineCommand } from "../factory/command";
import { db } from "../../config/database";

const registerDBCommands = () => {

    const runDrizzleKit = async (command: string, args: string[]) => {
        const proc = spawn(["bunx", "drizzle-kit", command, ...args], {
            stdout: "inherit",
            stderr: "inherit",
            stdin: "inherit",
            env: { ...process.env }
        });

        await proc.exited;
    };

    defineCommand('db:migrate', {
        description: 'Wendet ausstehende Migrationen auf die Datenbank an',
        handle: async () => {
            consola.start('Starte Datenbank-Migration...');

            try {
                const migrationsFolder = path.join(process.cwd(), 'drizzle');

                await migrate(db, { migrationsFolder });

                consola.success('Datenbank ist auf dem neuesten Stand!');
            } catch (error: any) {
                consola.error('Migration fehlgeschlagen:');
                consola.error(error.message);
                process.exit(1);
            }
        }
    });

    defineCommand('db:generate', {
        description: 'Generiert SQL-Migrationen aus dem Schema',
        handle: async (args) => {
            consola.info('Generiere Migrationen...');
            await runDrizzleKit("generate", args);
        }
    });

    defineCommand('db:push', {
        description: 'Synchronisiert Schema direkt mit der DB (Prototyping)',
        handle: async (args) => {
            consola.info('Push Schema zu DB...');
            await runDrizzleKit("push", args);
        }
    });

    defineCommand('db:studio', {
        description: 'Öffnet Drizzle Studio zur Datenverwaltung',
        handle: async (args) => {
            consola.info('Starte Drizzle Studio...');
            await runDrizzleKit("studio", args);
        }
    });

    defineCommand('db:drop', {
        description: 'Löscht alle Daten (Drizzle Drop)',
        handle: async (args) => {
            consola.warn('ACHTUNG: Dies löscht Migrationstabellen!');
            await runDrizzleKit("drop", args);
        }
    });
}

export { registerDBCommands }