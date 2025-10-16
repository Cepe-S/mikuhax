import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";
import { CommandUtils } from "../utils/CommandUtils";
import { PlayerUtils } from "../utils/PlayerUtils";

export function cmdBan(byPlayer: PlayerObject, message: string): void {
    if (!CommandUtils.requirePermission(byPlayer, 'admin')) return;
    
    const args = CommandUtils.parseArgs(message);
    if (args.length < 2) {
        CommandUtils.sendError(byPlayer.id, "Uso: !ban #ID [duración_minutos] [razón]");
        return;
    }

    const targetID = PlayerUtils.parsePlayerId(args[1]);
    if (!targetID) {
        CommandUtils.sendError(byPlayer.id, "Jugador no encontrado");
        return;
    }

    const targetPlayer = PlayerUtils.getPlayerData(targetID);
    if (!targetPlayer) {
        CommandUtils.sendError(byPlayer.id, "Jugador no encontrado");
        return;
    }
    const duration = args[2] ? parseInt(args[2]) : 60; // Default 60 minutes
    const reason = args.slice(3).join(' ');

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
        const reasonText = args.slice(3).length > 0 ? reason : '';
        
        let kickMessage = reasonText;
        if (kickMessage) kickMessage += '\n';
        kickMessage += `${expireText}\nPuedes apelar en Discord: https://discord.gg/qfg45B2`;
        
        window.gameRoom._room.sendAnnouncement(`🚫 ${targetPlayer.name} ha sido baneado`, null, 0xFF7777, "bold", 2);
        window.gameRoom._room.kickPlayer(targetID, kickMessage, false);
    }).catch(() => {
        CommandUtils.sendError(byPlayer.id, "Error al banear jugador");
    });
}

registerCommand("ban", cmdBan, {
    helpText: "🚫 Ban a player",
    category: "Admin Commands"
});