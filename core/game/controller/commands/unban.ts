import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";
import { clearAllNativeBans, cleanExpiredBans } from "../Storage";

export function cmdUnban(byPlayer: PlayerObject, message?: string): void {
    if(window.gameRoom.playerList.get(byPlayer.id)!.admin == true || window.gameRoom.playerList.get(byPlayer.id)!.permissions.superadmin == true) {
        if(message !== undefined && message.trim() !== '') {
            // Split the full message and remove the command part (!unban)
            const fullParts = message.trim().split(' ').filter(part => part !== '');
            const parts = fullParts.slice(1); // Remove the command (!unban) from the parts
            
            // Special command to clear all expired bans
            if(parts.length === 1 && parts[0].toLowerCase() === 'all') {
                cleanExpiredBans().then((clearedCount) => {
                    window.gameRoom._room.sendAnnouncement(`✅ Limpieza completada: ${clearedCount} bans expirados eliminados y sistema nativo limpiado`, null, 0x479947, "normal", 1);
                    window.gameRoom.logger.i('unban', `${byPlayer.name}#${byPlayer.id} cleared ${clearedCount} expired bans and native system`);
                }).catch((error) => {
                    window.gameRoom._room.sendAnnouncement("❌ Error al limpiar bans expirados", byPlayer.id, 0xFF7777, "normal", 2);
                    console.error("Clear expired bans error:", error);
                });
                return;
            }
            
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
                
                // Limpiar ban de la base de datos
                window._deleteBanByAuthDB(window.gameRoom.config._RUID, auth).then((success) => {
                    // Siempre intentar limpiar el sistema nativo de Haxball
                    // Buscar si el jugador está online para usar su ID
                    let playerIdToClear = null;
                    for (const [playerId, player] of window.gameRoom.playerList) {
                        if (player.auth === auth) {
                            playerIdToClear = playerId;
                            break;
                        }
                    }
                    
                    // Limpiar ban nativo si el jugador está online
                    if (playerIdToClear !== null) {
                        try {
                            window.gameRoom._room.clearBan(playerIdToClear);
                            window.gameRoom.logger.i('unban', `Cleared native ban for online player ${playerIdToClear}`);
                        } catch (error) {
                            // Ignorar error si no estaba baneado
                        }
                    }
                    
                    // Limpiar todos los bans nativos como medida de seguridad
                    clearAllNativeBans();
                    
                    if(success) {
                        window.gameRoom._room.sendAnnouncement(`✅ ${playerName} (auth: ${auth}) ha sido desbaneado`, null, 0x479947, "normal", 1);
                        window.gameRoom.logger.i('unban', `${byPlayer.name}#${byPlayer.id} unbanned ${playerName} (auth: ${auth})`);
                    } else {
                        // Aunque no esté en la DB, el clearBan nativo puede haber funcionado
                        window.gameRoom._room.sendAnnouncement(`⚠️ ${playerName} no estaba en la base de datos, pero se limpiaron los bans nativos`, null, 0xFFAA00, "normal", 1);
                    }
                }).catch((error) => {
                    // Aunque haya error en la DB, intentar limpiar bans nativos
                    clearAllNativeBans();
                    window.gameRoom._room.sendAnnouncement("⚠️ Error en base de datos, pero se limpiaron bans nativos", byPlayer.id, 0xFFAA00, "normal", 2);
                    console.error("Unban error:", error);
                });
            } else {
                window.gameRoom._room.sendAnnouncement("❌ Uso: !unban <player_auth> o !unban all (para limpiar bans expirados)", byPlayer.id, 0xFF7777, "normal", 2);
            }
        } else {
            window.gameRoom._room.sendAnnouncement("❌ Uso: !unban <player_auth> o !unban all (para limpiar bans expirados)", byPlayer.id, 0xFF7777, "normal", 2);
        }
    } else {
        window.gameRoom._room.sendAnnouncement("❌ No tienes permisos para usar este comando", byPlayer.id, 0xFF7777, "normal", 2);
    }
}

// Register the command
registerCommand("unban", cmdUnban, {
    helpText: "Elimina un ban usando el auth del jugador o limpia bans expirados. Uso: !unban <player_auth> o !unban all",
    category: "Admin Commands",
    requiresArgs: true,
    adminOnly: true
});
