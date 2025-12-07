#!/usr/bin/env bun

import { bootstrapApp } from '../core/application';
import { BootConsole } from '../core/cli';
import { runCommand } from '../core/factory/command';

import '../core/commands/db.commands'

async function main() {
    await BootConsole();
    await bootstrapApp();
    await runCommand();
}

main();