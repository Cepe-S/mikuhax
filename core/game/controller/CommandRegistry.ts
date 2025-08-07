/**
 * Command Registry System - Auto-registration for Haxbotron Commands
 * Simplifies command creation and management
 */

import { PlayerObject } from "../model/GameObject/PlayerObject";

export interface CommandMetadata {
    name: string;
    helpText: string;
    category: "Basic Commands" | "Game Commands" | "Admin Commands" | "Special Features";
    requiresArgs?: boolean;
    adminOnly?: boolean;
    superAdminOnly?: boolean;
}

export interface CommandHandler {
    (byPlayer: PlayerObject, message: string): void | Promise<void>;
}

export interface RegisteredCommand {
    handler: CommandHandler;
    meta: CommandMetadata;
}

class CommandRegistryClass {
    private commands = new Map<string, RegisteredCommand>();

    register(commandName: string, handler: CommandHandler, meta: CommandMetadata): void {
        this.commands.set(commandName, { handler, meta });
        console.log(`✅ Command registered: ${commandName}`);
    }

    get(commandName: string): RegisteredCommand | undefined {
        return this.commands.get(commandName);
    }

    getAll(): Map<string, RegisteredCommand> {
        return this.commands;
    }

    getAllByCategory(): Record<string, RegisteredCommand[]> {
        const categories: Record<string, RegisteredCommand[]> = {
            "Basic Commands": [],
            "Game Commands": [],
            "Admin Commands": [],
            "Special Features": []
        };

        this.commands.forEach((command, name) => {
            categories[command.meta.category].push({
                ...command,
                meta: { ...command.meta, name }
            });
        });

        return categories;
    }

    has(commandName: string): boolean {
        return this.commands.has(commandName);
    }

    size(): number {
        return this.commands.size;
    }

    getCommandNames(): string[] {
        return Array.from(this.commands.keys());
    }
}

// Singleton instance
export const CommandRegistry = new CommandRegistryClass();

// Helper function for command registration
export function registerCommand(
    commandName: string,
    handler: CommandHandler,
    meta: Omit<CommandMetadata, 'name'>
): void {
    CommandRegistry.register(commandName, handler, { ...meta, name: commandName });
}
