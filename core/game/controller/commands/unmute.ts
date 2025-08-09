import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdUnmute(byPlayer: PlayerObject, message?: string): void {
    if(window.gameRoom.playerList.get(byPlayer.id)!.admin == true || window.gameRoom.playerList.get(byPlayer.id)!.permissions.superadmin == true) {
        if(message !== undefined && message.trim() !== '') {
            // Split the full message and remove the command part (!unmute)
            const fullParts = message.trim().split(' ').filter(part => part !== '');
            const parts = fullParts.slice(1); // Remove the command (!unmute) from the parts
            
            if(parts.length >= 1 && parts[0].startsWith("#")) {
                const targetIdStr = parts[0].substring(1); // Remove the # symbol
                const targetId = parseInt(targetIdStr);
                
                console.log(`[DEBUG] Unmute command - targetId: ${targetId}, parts[0]: ${parts[0]}`);
                
                if(!isNaN(targetId) && window.gameRoom.playerList.has(targetId)) {
                    const targetPlayer = window.gameRoom.playerList.get(targetId)!;
                    
                    console.log(`[DEBUG] Target player found - name: ${targetPlayer.name}, auth: ${targetPlayer.auth}, conn: ${targetPlayer.conn}`);
                    
                    if(!targetPlayer.auth || targetPlayer.auth === '') {
                        window.gameRoom._room.sendAnnouncement("❌ Cannot unmute player: missing auth information", byPlayer.id, 0xFF7777, "normal", 2);
                        return;
                    }
                    
                    window._deleteMuteByAuthDB(window.gameRoom.config._RUID, targetPlayer.auth).then((success) => {
                        if(success) {
                            // Also unmute if player is currently online
                            targetPlayer.permissions.mute = false;
                            targetPlayer.permissions.muteExpire = 0;
                            
                            window.gameRoom._room.sendAnnouncement(`✅ ${targetPlayer.name} has been unmuted`, null, 0x479947, "normal", 1);
                            window.gameRoom.logger.i('unmute', `${byPlayer.name}#${byPlayer.id} unmuted ${targetPlayer.name}#${targetId} (auth: ${targetPlayer.auth})`);
                        } else {
                            window.gameRoom._room.sendAnnouncement(`❌ No mute found for ${targetPlayer.name}`, byPlayer.id, 0xFF7777, "normal", 2);
                        }
                    }).catch((error) => {
                        window.gameRoom._room.sendAnnouncement("❌ Error removing mute from database", byPlayer.id, 0xFF7777, "normal", 2);
                        console.error("Unmute error:", error);
                    });
                } else {
                    window.gameRoom._room.sendAnnouncement("❌ Invalid player ID", byPlayer.id, 0xFF7777, "normal", 2);
                }
            } else {
                window.gameRoom._room.sendAnnouncement("❌ Usage: !unmute #ID", byPlayer.id, 0xFF7777, "normal", 2);
            }
        } else {
            window.gameRoom._room.sendAnnouncement("❌ Usage: !unmute #ID", byPlayer.id, 0xFF7777, "normal", 2);
        }
    } else {
        window.gameRoom._room.sendAnnouncement("❌ You don't have permission to use this command", byPlayer.id, 0xFF7777, "normal", 2);
    }
}

// Register the command
registerCommand("unmute", cmdUnmute, {
    helpText: "Remove a mute by player ID. Usage: !unmute #ID",
    category: "Admin Commands",
    requiresArgs: true,
    adminOnly: true
});
