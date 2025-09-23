import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdMute(byPlayer: PlayerObject, message: string): void {
    const msgChunk = message.split(" ");
    if (msgChunk.length < 2) {
        window.gameRoom._room.sendAnnouncement("Uso: !mute #ID [duración_minutos] [razón]", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetStr = msgChunk[1];
    if (!targetStr.startsWith('#')) {
        window.gameRoom._room.sendAnnouncement("Uso: !mute #ID [duración_minutos] [razón]", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetID = parseInt(targetStr.substr(1));
    if (isNaN(targetID) || !window.gameRoom.playerList.has(targetID)) {
        window.gameRoom._room.sendAnnouncement("Jugador no encontrado", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetPlayer = window.gameRoom.playerList.get(targetID)!;
    const duration = msgChunk[2] ? parseInt(msgChunk[2]) : 30; // Default 30 minutes
    const reason = msgChunk.slice(3).join(' ') || 'No especificada';

    window._createMuteDB(
        window.gameRoom.config._RUID,
        targetPlayer.auth,
        targetPlayer.conn,
        reason,
        duration,
        byPlayer.auth,
        byPlayer.name
    ).then(() => {
        const expireText = duration > 0 ? `${duration} minutos` : 'permanente';
        targetPlayer.permissions.mute = true;
        targetPlayer.permissions.muteExpire = duration > 0 ? Date.now() + (duration * 60 * 1000) : -1;
        window.gameRoom._room.sendAnnouncement(`🔇 ${targetPlayer.name} ha sido muteado por ${expireText}. Razón: ${reason}`, null, 0xFFD700, "bold", 1);
    }).catch(() => {
        window.gameRoom._room.sendAnnouncement("Error al mutear jugador", byPlayer.id, 0xFF7777, "normal", 2);
    });
}

registerCommand("mute", cmdMute, {
    helpText: "🔇 Mute a player",
    category: "Admin Commands",
    adminOnly: true
});