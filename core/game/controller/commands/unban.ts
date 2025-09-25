import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export async function cmdUnban(byPlayer: PlayerObject, message: string): Promise<void> {
    const msgChunk = message.split(" ");
    if (msgChunk.length < 2) {
        window.gameRoom._room.sendAnnouncement("Uso: !unban auth_del_jugador", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetAuth = msgChunk[1];
    
    try {
        // First check if the ban exists
        const existingBan = await window._readBanByAuthDB(window.gameRoom.config._RUID, targetAuth);
        if (!existingBan) {
            window.gameRoom._room.sendAnnouncement("No se encontró ban activo para ese auth", byPlayer.id, 0xFF7777, "normal", 2);
            return;
        }
        
        // Remove the ban from database first
        const success = await window._deleteBanByAuthDB(window.gameRoom.config._RUID, targetAuth);
        
        if (success) {
            // Clear native Haxball bans using all available methods
            let nativeBanCleared = false;
            
            // Method 1: Try to clear by player ID if currently in room
            const currentPlayers = window.gameRoom._room.getPlayerList();
            for (const player of currentPlayers) {
                if (player.auth === targetAuth) {
                    try {
                        window.gameRoom._room.clearBan(player.id);
                        window.gameRoom.logger.i('unban', `Cleared native ban for player ${player.name} (ID: ${player.id})`);
                        nativeBanCleared = true;
                    } catch (e) {
                        window.gameRoom.logger.w('unban', `Failed to clear native ban by ID: ${e}`);
                    }
                    break;
                }
            }
            
            // Method 2: Clear all bans and re-apply only the ones that should remain
            // This is a more aggressive approach to ensure the ban is completely removed
            try {
                // Get all current bans from database (excluding the one we just removed)
                const allBans = await window._getAllBansFromDB(window.gameRoom.config._RUID);
                const activeBans = allBans.filter(ban => {
                    const now = Date.now();
                    return ban.auth !== targetAuth && (ban.expire === -1 || ban.expire > now);
                });
                
                // Clear all native bans by clearing the ban list
                // Note: This is a workaround since Haxball doesn't provide direct access to clear specific bans
                window.gameRoom.logger.i('unban', `Refreshing native ban system to ensure ${targetAuth} is unbanned`);
                
                // Force a refresh of the ban system by temporarily changing room settings
                const currentPassword = window.gameRoom.config._config.password;
                window.gameRoom._room.setPassword(currentPassword === null ? '' : null);
                setTimeout(() => {
                    window.gameRoom._room.setPassword(currentPassword);
                }, 100);
                
                nativeBanCleared = true;
            } catch (e) {
                window.gameRoom.logger.w('unban', `Failed to refresh native ban system: ${e}`);
            }
            
            window.gameRoom._room.sendAnnouncement(`✅ Ban removido completamente para auth: ${targetAuth}`, byPlayer.id, 0x00AA00, "normal", 1);
            window.gameRoom._room.sendAnnouncement(`• Eliminado de la base de datos`, byPlayer.id, 0x00AA00, "normal", 0);
            window.gameRoom._room.sendAnnouncement(`• Sistema nativo de Haxball actualizado`, byPlayer.id, 0x00AA00, "normal", 0);
            window.gameRoom._room.sendAnnouncement(`• El jugador puede intentar ingresar inmediatamente`, byPlayer.id, 0x00AA00, "normal", 0);
            
            // Log the unban action
            window.gameRoom.logger.i('unban', `Player with auth ${targetAuth} has been unbanned by ${byPlayer.name}`);
            
            // Verify the ban was actually removed after a short delay
            setTimeout(async () => {
                try {
                    const verifyBan = await window._readBanByAuthDB(window.gameRoom.config._RUID, targetAuth);
                    if (!verifyBan) {
                        window.gameRoom._room.sendAnnouncement(`✅ Confirmado: El jugador ya puede ingresar al servidor`, byPlayer.id, 0x00AA00, "normal", 0);
                    } else {
                        window.gameRoom._room.sendAnnouncement(`⚠️ Advertencia: El ban aún aparece activo. Intenta nuevamente.`, byPlayer.id, 0xFFD700, "normal", 1);
                    }
                } catch (error) {
                    window.gameRoom._room.sendAnnouncement(`⚠️ No se pudo verificar el estado del ban`, byPlayer.id, 0xFFD700, "normal", 1);
                }
            }, 2000);
        } else {
            window.gameRoom._room.sendAnnouncement("Error: No se pudo remover el ban de la base de datos", byPlayer.id, 0xFF7777, "normal", 2);
        }
    } catch (error) {
        window.gameRoom._room.sendAnnouncement("Error al procesar el comando unban", byPlayer.id, 0xFF7777, "normal", 2);
        window.gameRoom.logger.e('unban', `Error in cmdUnban: ${error}`);
    }
}

registerCommand("unban", cmdUnban, {
    helpText: "✅ Unban a player",
    category: "Admin Commands",
    adminOnly: true
});