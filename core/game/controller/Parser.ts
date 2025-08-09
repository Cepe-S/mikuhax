import * as LangRes from "../resource/strings";
import { PlayerObject } from "../model/GameObject/PlayerObject";
import { CommandRegistry } from "./CommandRegistry";
// Import all migrated commands to auto-register them
import "./commands/discord";
import "./commands/about";
import "./commands/help";
import "./commands/stats";
import "./commands/streak";
import "./commands/statsreset";
import "./commands/scout";
import "./commands/tier";
import "./commands/ranking";
import "./commands/memide";
import "./commands/balance";
import "./commands/avatar";
import "./commands/map";
import "./commands/llamaradmin";
import "./commands/poss";
import "./commands/afk";
import "./commands/nv";
import "./commands/bb";
import "./commands/list";
import "./commands/freeze";
import "./commands/mute";
import "./commands/ban";
import "./commands/unban";
import "./commands/unmute";
import "./commands/debugpowershot";
import "./commands/connectionstats";
import "./commands/vote";
import "./commands/notice";
import "./commands/powershotadmin";
import "./commands/super";
import "./commands/goleadores";
import "./commands/asistidores";
import "./commands/camisetas";
import "./commands/size";

// Check if given string is a command chat. Returns true if it is, false otherwise.
export function isCommandString(message: string): boolean {
    return message.charAt(0) === window.gameRoom.config.commands._commandPrefix;
}

// Divide message into 3 parts by separator: !COMMAND FIRST-ARG SECOND-ARG
export function getCommandChunk(message: string): string[] { 
    return message.split(" ", 3);
}

// Parse command message and execute it (must check if it's a command first)
export function parseCommand(byPlayer: PlayerObject, message: string): void {
    const msgChunk: string[] = getCommandChunk(message);
    const commandSign: string = msgChunk[0].substring(1); // Remove prefix character (default: !)
    
    if(window.gameRoom.config.commands._disabledCommandList?.includes(commandSign)) { // If this command is in disabled list
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorDisabled, byPlayer.id, 0xFF7777, "normal", 2); // Notify
        return; // Exit this function
    }

    // 🆕 Try new command registry first
    const registeredCommand = CommandRegistry.get(commandSign);
    if (registeredCommand) {
        try {
            // Check permissions if needed
            if (registeredCommand.meta.superAdminOnly && !window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
                window.gameRoom._room.sendAnnouncement("❌ Solo los superadministradores pueden usar este comando.", byPlayer.id, 0xFF7777, "normal", 2);
                return;
            }
            if (registeredCommand.meta.adminOnly && !byPlayer.admin && !window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
                window.gameRoom._room.sendAnnouncement("❌ Solo los administradores pueden usar este comando.", byPlayer.id, 0xFF7777, "normal", 2);
                return;
            }
            
            // Execute the registered command
            registeredCommand.handler(byPlayer, message);
            return;
        } catch (error) {
            console.error(`Error executing command ${commandSign}:`, error);
            window.gameRoom._room.sendAnnouncement("❌ Error al ejecutar el comando.", byPlayer.id, 0xFF7777, "normal", 2);
            return;
        }
    }

    // Fallback to legacy switch system for non-migrated commands
    switch(commandSign) {
        default: {
            window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
            break;
        }
    }
}
