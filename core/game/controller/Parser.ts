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
import "./commands/banlist";
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
import "./commands/cola";
import "./commands/debugtop20";
import "./commands/teamup";
import "./commands/teamuptoggle";
import "./commands/clearbans";
import "./commands/randomteams";
import "./commands/checkban";

import "./commands/balancestatus";
import "./commands/debugstadium";
import "./commands/debugcoordinator";
import "./commands/debugmute";
import "./commands/resetcoordinator";
import "./commands/antispam";

// Check if given string is a command chat. Returns true if it is, false otherwise.
export function isCommandString(message: string): boolean {
    return message.charAt(0) === window.gameRoom.config.commands._commandPrefix;
}

// Check if given string is a private message. Returns true if it is, false otherwise.
export function isPrivateMessage(message: string): boolean {
    return message.startsWith('ac ') || message.startsWith('@');
}

// Handle private messages (admin chat and player-to-player)
export function handlePrivateMessage(sender: PlayerObject, message: string): void {
    const senderData = window.gameRoom.playerList.get(sender.id)!;
    const isAdmin = sender.admin || senderData.permissions.superadmin;
    
    if (message.startsWith('ac ')) {
        // Admin chat - only admins can use this
        if (!isAdmin) {
            window.gameRoom._room.sendAnnouncement("❌ Solo los administradores pueden usar el chat administrativo.", sender.id, 0xFF7777, "normal", 2);
            return;
        }
        
        const adminMessage = message.substring(3).trim();
        if (adminMessage.length === 0) {
            window.gameRoom._room.sendAnnouncement("❌ El mensaje no puede estar vacío.", sender.id, 0xFF7777, "normal", 2);
            return;
        }
        
        // Send to all admins
        const formattedMessage = `👑 [ADMIN] ${sender.name}: ${adminMessage}`;
        window.gameRoom.playerList.forEach((player, playerId) => {
            if (player.admin || player.permissions.superadmin) {
                window.gameRoom._room.sendAnnouncement(formattedMessage, playerId, 0xFFD700, "bold", 1);
            }
        });
        
        window.gameRoom.logger.i('adminChat', `[ADMIN] ${sender.name}#${sender.id}: ${adminMessage}`);
        
    } else if (message.startsWith('@')) {
        // Private message to specific player
        const spaceIndex = message.indexOf(' ');
        if (spaceIndex === -1) {
            window.gameRoom._room.sendAnnouncement("❌ Uso: @jugador mensaje", sender.id, 0xFF7777, "normal", 2);
            return;
        }
        
        const targetName = message.substring(1, spaceIndex).trim();
        const privateMessage = message.substring(spaceIndex + 1).trim();
        
        if (privateMessage.length === 0) {
            window.gameRoom._room.sendAnnouncement("❌ El mensaje no puede estar vacío.", sender.id, 0xFF7777, "normal", 2);
            return;
        }
        
        // Find target player by name (case insensitive, treating spaces and underscores as equivalent)
        const normalizePlayerName = (name: string) => name.toLowerCase().replace(/[_\s]/g, '');
        const normalizedSearchName = normalizePlayerName(targetName);
        let targetPlayer: PlayerObject | null = null;
        let targetId: number | null = null;
        
        window.gameRoom.playerList.forEach((player, playerId) => {
            if (normalizePlayerName(player.name) === normalizedSearchName) {
                targetPlayer = player;
                targetId = playerId;
            }
        });
        
        if (!targetPlayer || targetId === null) {
            window.gameRoom._room.sendAnnouncement(`❌ Jugador '${targetName}' no encontrado.`, sender.id, 0xFF7777, "normal", 2);
            return;
        }
        
        if (targetId === sender.id) {
            window.gameRoom._room.sendAnnouncement("❌ No puedes enviarte un mensaje privado a ti mismo.", sender.id, 0xFF7777, "normal", 2);
            return;
        }
        
        // Send private message
        const senderMessage = `📩 [A ${targetPlayer.name}]: ${privateMessage}`;
        const receiverMessage = `📨 [De ${sender.name}]: ${privateMessage}`;
        
        window.gameRoom._room.sendAnnouncement(senderMessage, sender.id, 0x00FF00, "normal", 1);
        window.gameRoom._room.sendAnnouncement(receiverMessage, targetId, 0x00FF00, "normal", 1);
        
        window.gameRoom.logger.i('privateMessage', `${sender.name}#${sender.id} -> ${targetPlayer.name}#${targetId}: ${privateMessage}`);
    }
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
            // Execute the registered command (permission checks are now handled inside each command)
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
