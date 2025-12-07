#!/usr/bin/env bun
import { bootstrapApp } from '../core/application';
import { BootConsole } from '../core/cli';
import { runCommand } from '../core/factory/command';

import { registerDBCommands } from '../core/commands/db.commands';
import { registerMakeCommands } from '../core/commands/make.command';
import { registerDevCommands } from '../core/commands/dev.commands';

async function main() {

    // Register Core Commands
    registerDBCommands()
    registerMakeCommands()
    registerDevCommands()

    await BootConsole();
    await bootstrapApp();
    await runCommand();
}

main();