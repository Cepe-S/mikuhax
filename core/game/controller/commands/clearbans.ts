import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export async function cmdClearBans(byPlayer: PlayerObject, message: string): Promise<void> {
    try {
        // Get all active bans from database
        const allBans = await window._getAllBansFromDB(window.gameRoom.config._RUID);
        const now = Date.now();
        const activeBans = allBans.filter(ban => ban.expire === -1 || ban.expire > now);
        
        // Force refresh of native ban system by temporarily changing room settings
        const currentPassword = window.gameRoom.config._config.password;
        window.gameRoom._room.setPassword(currentPassword === null ? '' : null);
        
        setTimeout(() => {
            window.gameRoom._room.setPassword(currentPassword);
        }, 100);
        
        window.gameRoom._room.sendAnnouncement(`✅ Sistema de baneos nativo limpiado`, byPlayer.id, 0x00AA00, "normal", 1);
        window.gameRoom._room.sendAnnouncement(`• ${activeBans.length} baneos activos en base de datos`, byPlayer.id, 0x00AA00, "normal", 0);
        window.gameRoom._room.sendAnnouncement(`• Sistema nativo de Haxball refrescado`, byPlayer.id, 0x00AA00, "normal", 0);
        window.gameRoom._room.sendAnnouncement(`• Los jugadores desbaneados pueden intentar ingresar`, byPlayer.id, 0x00AA00, "normal", 0);
        
        window.gameRoom.logger.i('clearbans', `Native ban system cleared by ${byPlayer.name}. ${activeBans.length} active bans remain in database.`);
        
    } catch (error) {
        window.gameRoom._room.sendAnnouncement("Error al limpiar el sistema de baneos", byPlayer.id, 0xFF7777, "normal", 2);
        window.gameRoom.logger.e('clearbans', `Error in cmdClearBans: ${error}`);
    }
}

registerCommand("clearbans", cmdClearBans, {
    helpText: "🧹 Clear native Haxball ban system",
    category: "Admin Commands",
    adminOnly: true
});