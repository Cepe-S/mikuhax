import { getUnixTimestamp } from "../Statistics";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { registerCommand } from "../CommandRegistry";

export function cmdBan(byPlayer: PlayerObject, message?: string): void {
    console.log(`[DEBUG] cmdBan called with message: "${message}"`);
    if(window.gameRoom.playerList.get(byPlayer.id)!.admin == true || window.gameRoom.playerList.get(byPlayer.id)!.permissions.superadmin == true) {
        if(message !== undefined && message.trim() !== '') {
            // Split the full message and remove the command part (!ban)
            const fullParts = message.trim().split(' ').filter(part => part !== '');
            const parts = fullParts.slice(1); // Remove the command (!ban) from the parts
            console.log(`[DEBUG] fullParts:`, fullParts, `parts:`, parts);
            
            if(parts.length >= 1 && parts[0].startsWith("#")) {
                console.log(`[DEBUG] Valid command format detected`);
                const target: number = parseInt(parts[0].substring(1), 10);
                
                // Parse duration - if not provided or invalid, default to 0 (permanent)
                let durationMinutes: number = 0; // Default to permanent
                if(parts.length >= 2 && parts[1] !== '') {
                    const parsedDuration = parseInt(parts[1], 10);
                    if(!isNaN(parsedDuration) && parsedDuration >= 0) {
                        durationMinutes = parsedDuration;
                    }
                }
                
                // Parse reason - if not provided, use default
                const reason: string = parts.length >= 3 ? parts.slice(2).join(' ') : 'Banned by admin';
                
                if(isNaN(target) != true && window.gameRoom.playerList.has(target) == true) {
                    const targetPlayer = window.gameRoom.playerList.get(target)!;
                    
                    // Create ban in database
                    window._createBanDB(
                        window.gameRoom.config._RUID,
                        targetPlayer.auth,
                        targetPlayer.conn,
                        reason,
                        durationMinutes,
                        byPlayer.auth,
                        byPlayer.name,
                        targetPlayer.name
                    ).then(() => {
                        // Kick with ban
                        const banMsg = durationMinutes > 0 
                            ? `Banned for ${durationMinutes} minutes. Reason: ${reason}`
                            : `Permanently banned. Reason: ${reason}`;
                        
                        window.gameRoom._room.kickPlayer(target, banMsg, false);
                        
                        const successMsg = durationMinutes > 0
                            ? `🚫 ${targetPlayer.name} has been banned for ${durationMinutes} minutes. Reason: ${reason}`
                            : `🚫 ${targetPlayer.name} has been permanently banned. Reason: ${reason}`;
                        
                        window.gameRoom._room.sendAnnouncement(successMsg, null, 0xFF7777, "normal", 1);
                        window.gameRoom.logger.i('ban', `${byPlayer.name}#${byPlayer.id} banned ${targetPlayer.name}#${target} for ${durationMinutes}min. Reason: ${reason}`);
                    }).catch((error) => {
                        window.gameRoom._room.sendAnnouncement("❌ Error applying ban to database", byPlayer.id, 0xFF7777, "normal", 2);
                        console.error("Ban error:", error);
                    });
                } else {
                    window.gameRoom._room.sendAnnouncement("❌ Invalid player ID", byPlayer.id, 0xFF7777, "normal", 2);
                }
            } else {
                console.log(`[DEBUG] Invalid command format. parts.length: ${parts.length}, first part: "${parts[0]}"`);
                window.gameRoom._room.sendAnnouncement("❌ Usage: !ban #ID [minutes] [reason] - Minutes and reason are optional", byPlayer.id, 0xFF7777, "normal", 2);
            }
        } else {
            console.log(`[DEBUG] Empty or undefined message`);
            window.gameRoom._room.sendAnnouncement("❌ Usage: !ban #ID [minutes] [reason] - Minutes and reason are optional", byPlayer.id, 0xFF7777, "normal", 2);
        }
    } else {
        window.gameRoom._room.sendAnnouncement("❌ You don't have permission to use this command", byPlayer.id, 0xFF7777, "normal", 2);
    }
}

// Register the command
registerCommand("ban", cmdBan, {
    helpText: "Ban a player. Usage: !ban #ID [minutes] [reason]. Minutes and reason are optional - leave empty for permanent ban with default reason.",
    category: "Admin Commands",
    requiresArgs: true,
    adminOnly: true
});
