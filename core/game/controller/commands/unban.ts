import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdUnban(byPlayer: PlayerObject, message?: string): void {
    if(window.gameRoom.playerList.get(byPlayer.id)!.admin == true || window.gameRoom.playerList.get(byPlayer.id)!.permissions.superadmin == true) {
        if(message !== undefined && message.trim() !== '') {
            // Split the full message and remove the command part (!unban)
            const fullParts = message.trim().split(' ').filter(part => part !== '');
            const parts = fullParts.slice(1); // Remove the command (!unban) from the parts
            
            if(parts.length >= 1) {
                let auth = parts[0];
                let playerName = 'Unknown';
                
                // Check if it's a player ID format (#ID)
                if(auth.startsWith("#")) {
                    const targetIdStr = auth.substring(1); // Remove the # symbol
                    const targetId = parseInt(targetIdStr);
                    
                    if(!isNaN(targetId) && window.gameRoom.playerList.has(targetId)) {
                        const targetPlayer = window.gameRoom.playerList.get(targetId)!;
                        auth = targetPlayer.auth;
                        playerName = targetPlayer.name;
                    } else {
                        window.gameRoom._room.sendAnnouncement("❌ Invalid player ID", byPlayer.id, 0xFF7777, "normal", 2);
                        return;
                    }
                } else {
                    // It's an auth string, try to find player name if online
                    for (const [playerId, player] of window.gameRoom.playerList) {
                        if (player.auth === auth) {
                            playerName = player.name;
                            break;
                        }
                    }
                }
                
                window._deleteBanByAuthDB(window.gameRoom.config._RUID, auth).then((success) => {
                    if(success) {
                        window.gameRoom._room.sendAnnouncement(`✅ ${playerName} (auth: ${auth}) has been unbanned`, null, 0x479947, "normal", 1);
                        window.gameRoom.logger.i('unban', `${byPlayer.name}#${byPlayer.id} unbanned ${playerName} (auth: ${auth})`);
                    } else {
                        window.gameRoom._room.sendAnnouncement(`❌ No ban found for auth: ${auth}`, byPlayer.id, 0xFF7777, "normal", 2);
                    }
                }).catch((error) => {
                    window.gameRoom._room.sendAnnouncement("❌ Error removing ban from database", byPlayer.id, 0xFF7777, "normal", 2);
                    console.error("Unban error:", error);
                });
            } else {
                window.gameRoom._room.sendAnnouncement("❌ Usage: !unban #ID or !unban <player_auth>", byPlayer.id, 0xFF7777, "normal", 2);
            }
        } else {
            window.gameRoom._room.sendAnnouncement("❌ Usage: !unban #ID or !unban <player_auth>", byPlayer.id, 0xFF7777, "normal", 2);
        }
    } else {
        window.gameRoom._room.sendAnnouncement("❌ You don't have permission to use this command", byPlayer.id, 0xFF7777, "normal", 2);
    }
}

// Register the command
registerCommand("unban", cmdUnban, {
    helpText: "Remove a ban by player ID or auth. Usage: !unban #ID or !unban <player_auth>",
    category: "Admin Commands",
    requiresArgs: true,
    adminOnly: true
});
