import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export async function cmdBanlist(byPlayer: PlayerObject, message?: string): Promise<void> {
    try {
        const bans = await window._getAllBansFromDB(window.gameRoom.config._RUID);
        
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
                new Date(ban.expire).toLocaleString('es-ES', { 
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });
            const playerName = ban.playerName || "Desconocido";
            const reason = ban.reason || "Sin razón";
            const authDisplay = ban.auth ? ban.auth : "Sin auth";
            
            // Show name and auth on first line
            window.gameRoom._room.sendAnnouncement(
                `${index + 1}. ${playerName} | Auth: ${authDisplay}`,
                byPlayer.id,
                0xFFFFFF,
                "normal",
                0
            );
            
            // Show reason and expiration on second line
            window.gameRoom._room.sendAnnouncement(
                `   Razón: ${reason} | Expira: ${expireText}`,
                byPlayer.id,
                0xCCCCCC,
                "small",
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
        
        // Show usage tip
        window.gameRoom._room.sendAnnouncement(
            "📝 Para desbanear usa: !unban <auth>",
            byPlayer.id,
            0x479947,
            "small",
            0
        );
    } catch (error) {
        window.gameRoom._room.sendAnnouncement("❌ Error al obtener la lista de baneados", byPlayer.id, 0xFF7777, "normal", 2);
        console.error('Error in cmdBanlist:', error);
    }
}

registerCommand("banlist", cmdBanlist, {
    helpText: "📋 Show list of banned players",
    category: "Admin Commands",
    adminOnly: true
});