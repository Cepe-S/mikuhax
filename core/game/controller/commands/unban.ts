import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdUnban(byPlayer: PlayerObject, message: string): void {
    const msgChunk = message.split(" ");
    if (msgChunk.length < 2) {
        window.gameRoom._room.sendAnnouncement("Uso: !unban auth_del_jugador", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetAuth = msgChunk[1];
    
    window._deleteBanByAuthDB(
        window.gameRoom.config._RUID,
        targetAuth
    ).then((success) => {
        if (success) {
            window.gameRoom._room.sendAnnouncement(`✅ Ban removido para auth: ${targetAuth}`, byPlayer.id, 0x00AA00, "normal", 1);
        } else {
            window.gameRoom._room.sendAnnouncement("No se encontró ban activo para ese auth", byPlayer.id, 0xFF7777, "normal", 2);
        }
    }).catch(() => {
        window.gameRoom._room.sendAnnouncement("Error al remover ban", byPlayer.id, 0xFF7777, "normal", 2);
    });
}

registerCommand("unban", cmdUnban, {
    helpText: "✅ Unban a player",
    category: "Admin Commands",
    adminOnly: true
});