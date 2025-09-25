import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdBan(byPlayer: PlayerObject, message: string): void {
    const msgChunk = message.split(" ");
    if (msgChunk.length < 2) {
        window.gameRoom._room.sendAnnouncement("Uso: !ban #ID [duración_minutos] [razón]", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetStr = msgChunk[1];
    if (!targetStr.startsWith('#')) {
        window.gameRoom._room.sendAnnouncement("Uso: !ban #ID [duración_minutos] [razón]", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetID = parseInt(targetStr.substr(1));
    if (isNaN(targetID) || !window.gameRoom.playerList.has(targetID)) {
        window.gameRoom._room.sendAnnouncement("Jugador no encontrado", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetPlayer = window.gameRoom.playerList.get(targetID)!;
    const duration = msgChunk[2] ? parseInt(msgChunk[2]) : 60; // Default 60 minutes
    const reason = msgChunk.slice(3).join(' ');
    const adminData = window.gameRoom.playerList.get(byPlayer.id)!;

    window._createBanDB(
        window.gameRoom.config._RUID,
        targetPlayer.auth,
        targetPlayer.conn,
        reason,
        duration,
        byPlayer.auth,
        byPlayer.name,
        targetPlayer.name
    ).then(() => {
        const expireText = duration > 0 ? `Termina en ${duration} minutos` : 'Permanente';
        const reasonText = msgChunk.slice(3).length > 0 ? reason : '';
        
        let kickMessage = reasonText;
        if (kickMessage) kickMessage += '\n';
        kickMessage += `${expireText}\nPuedes apelar en Discord: https://discord.gg/qfg45B2`;
        
        window.gameRoom._room.sendAnnouncement(`🚫 ${targetPlayer.name} ha sido baneado`, null, 0xFF7777, "bold", 2);
        window.gameRoom._room.kickPlayer(targetID, kickMessage, false);
    }).catch(() => {
        window.gameRoom._room.sendAnnouncement("Error al banear jugador", byPlayer.id, 0xFF7777, "normal", 2);
    });
}

registerCommand("ban", cmdBan, {
    helpText: "🚫 Ban a player",
    category: "Admin Commands",
    adminOnly: true
});