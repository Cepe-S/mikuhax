import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdBanlist(byPlayer: PlayerObject, message?: string): void {
    window._getAllBansFromDB(window.gameRoom.config._RUID).then((bans) => {
        if (!bans || bans.length === 0) {
            window.gameRoom._room.sendAnnouncement("📋 No hay jugadores baneados", byPlayer.id, 0x00AA00, "normal", 1);
            return;
        }

        const activeBans = bans.filter(ban => {
            if (ban.expire === -1) return true; // Permanent ban
            return Date.now() < ban.expire; // Check if ban is still active
        });

        if (activeBans.length === 0) {
            window.gameRoom._room.sendAnnouncement("📋 No hay jugadores baneados activos", byPlayer.id, 0x00AA00, "normal", 1);
            return;
        }

        window.gameRoom._room.sendAnnouncement(`📋 Lista de baneados (${activeBans.length}):`, byPlayer.id, 0xFFD700, "bold", 1);
        
        activeBans.slice(0, 10).forEach((ban, index) => {
            const expireText = ban.expire === -1 ? "Permanente" : 
                `${Math.ceil((ban.expire - Date.now()) / (1000 * 60))} min`;
            const playerName = ban.playerName || "Desconocido";
            const reason = ban.reason || "Sin razón";
            
            window.gameRoom._room.sendAnnouncement(
                `${index + 1}. ${playerName} - ${reason} (${expireText})`,
                byPlayer.id,
                0xFFFFFF,
                "normal",
                0
            );
        });

        if (activeBans.length > 10) {
            window.gameRoom._room.sendAnnouncement(
                `... y ${activeBans.length - 10} más`,
                byPlayer.id,
                0x888888,
                "italic",
                0
            );
        }
    }).catch(() => {
        window.gameRoom._room.sendAnnouncement("❌ Error al obtener la lista de baneados", byPlayer.id, 0xFF7777, "normal", 2);
    });
}

registerCommand("banlist", cmdBanlist, {
    helpText: "📋 Show list of banned players",
    category: "Admin Commands",
    adminOnly: true
});