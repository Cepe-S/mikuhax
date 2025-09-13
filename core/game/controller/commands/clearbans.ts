import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";
import { clearAllNativeBans, cleanExpiredBans } from "../Storage";

export function cmdClearBans(byPlayer: PlayerObject, message?: string): void {
    if(window.gameRoom.playerList.get(byPlayer.id)!.admin == true || window.gameRoom.playerList.get(byPlayer.id)!.permissions.superadmin == true) {
        // Clear all native bans and expired database bans
        Promise.all([
            cleanExpiredBans(),
            new Promise<void>((resolve) => {
                clearAllNativeBans();
                resolve();
            })
        ]).then(([clearedCount]) => {
            window.gameRoom._room.sendAnnouncement(`✅ Sistema de bans limpiado completamente:`, null, 0x479947, "bold", 1);
            window.gameRoom._room.sendAnnouncement(`• ${clearedCount} bans expirados eliminados de la base de datos`, null, 0x479947, "normal", 1);
            window.gameRoom._room.sendAnnouncement(`• Todos los bans nativos de Haxball limpiados`, null, 0x479947, "normal", 1);
            window.gameRoom._room.sendAnnouncement(`• Los jugadores pueden intentar reconectarse ahora`, null, 0x479947, "normal", 1);
            window.gameRoom.logger.i('clearbans', `${byPlayer.name}#${byPlayer.id} cleared all bans (${clearedCount} expired from DB + native system)`);
        }).catch((error) => {
            window.gameRoom._room.sendAnnouncement("❌ Error al limpiar el sistema de bans", byPlayer.id, 0xFF7777, "normal", 2);
            console.error("Clear bans error:", error);
        });
    } else {
        window.gameRoom._room.sendAnnouncement("❌ No tienes permisos para usar este comando", byPlayer.id, 0xFF7777, "normal", 2);
    }
}

// Register the command
registerCommand("clearbans", cmdClearBans, {
    helpText: "Limpia todos los bans expirados de la base de datos y todos los bans nativos de Haxball",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});