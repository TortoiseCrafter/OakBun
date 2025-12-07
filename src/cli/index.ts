#!/usr/bin/env bun
import { bootstrapApp } from "../core/application";
import { BootConsole } from "../core/cli";
import { runCommand } from "../core/factory/command";

async function main() {
    await BootConsole();
    await bootstrapApp();
    await runCommand();
}

main();