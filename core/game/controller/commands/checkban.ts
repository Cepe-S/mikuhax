import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export async function cmdCheckban(byPlayer: PlayerObject, message: string): Promise<void> {
    const msgChunk = message.split(" ");
    if (msgChunk.length < 2) {
        window.gameRoom._room.sendAnnouncement("Uso: !checkban auth_del_jugador", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetAuth = msgChunk[1];
    
    try {
        window.gameRoom._room.sendAnnouncement(`🔍 Verificando estado de ban para auth: ${targetAuth}...`, byPlayer.id, 0xFFD700, "normal", 1);
        
        const banCheck = await window._readBanByAuthDB(window.gameRoom.config._RUID, targetAuth);
        
        if (banCheck) {
            const expireText = banCheck.expire === -1 ? 'permanente' : 
                new Date(banCheck.expire).toLocaleString('es-ES', { 
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            const reason = banCheck.reason || 'Sin razón';
            const playerName = banCheck.playerName || 'Desconocido';
            
            window.gameRoom._room.sendAnnouncement(
                `🚫 BANEADO: ${playerName} (Auth: ${targetAuth})`,
                byPlayer.id,
                0xFF7777,
                "bold",
                1
            );
            window.gameRoom._room.sendAnnouncement(
                `   Razón: ${reason}`,
                byPlayer.id,
                0xFFFFFF,
                "normal",
                0
            );
            window.gameRoom._room.sendAnnouncement(
                `   Expira: ${expireText}`,
                byPlayer.id,
                0xFFFFFF,
                "normal",
                0
            );
        } else {
            window.gameRoom._room.sendAnnouncement(
                `✅ NO BANEADO: El auth ${targetAuth} no tiene bans activos`,
                byPlayer.id,
                0x00AA00,
                "normal",
                1
            );
        }
    } catch (error) {
        window.gameRoom._room.sendAnnouncement("❌ Error al verificar el ban", byPlayer.id, 0xFF7777, "normal", 2);
        console.error('Error in cmdCheckban:', error);
    }
}

registerCommand("checkban", cmdCheckban, {
    helpText: "🔍 Check if a player is banned by auth",
    category: "Admin Commands",
    adminOnly: true
});