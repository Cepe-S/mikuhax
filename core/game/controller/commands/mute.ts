import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

// Add mute debug tracking
function addMuteDebugAction(action: string, playerName: string, playerId: number, duration: number, reason: string) {
    if (!window.gameRoom.muteDebugActions) {
        window.gameRoom.muteDebugActions = [];
    }
    
    window.gameRoom.muteDebugActions.unshift({
        timestamp: Date.now(),
        action,
        playerName,
        playerId,
        duration,
        reason,
        expireTime: duration > 0 ? Date.now() + (duration * 60 * 1000) : -1
    });
    
    // Keep only last 10 actions
    if (window.gameRoom.muteDebugActions.length > 10) {
        window.gameRoom.muteDebugActions = window.gameRoom.muteDebugActions.slice(0, 10);
    }
}

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
        byPlayer.name,
        targetPlayer.name
    ).then(() => {
        const expireText = duration > 0 ? `${duration} minutos` : 'permanente';
        targetPlayer.permissions.mute = true;
        targetPlayer.permissions.muteExpire = duration > 0 ? Date.now() + (duration * 60 * 1000) : -1;
        
        // Notify everyone about the mute
        window.gameRoom._room.sendAnnouncement(`🔇 ${targetPlayer.name} ha sido muteado por ${expireText}. Razón: ${reason}`, null, 0xFFD700, "bold", 1);
        
        // Notify the muted player specifically about the duration
        const muteMessage = duration > 0 
            ? `🔇 Has sido MUTEADO por ${duration} minutos. Razón: ${reason}. Tu mute expirará automáticamente.`
            : `🔇 Has sido MUTEADO PERMANENTEMENTE. Razón: ${reason}. Contacta a un admin para ser desmuteado.`;
        
        window.gameRoom._room.sendAnnouncement(
            muteMessage,
            targetPlayer.id,
            0xFF7777,
            "bold",
            2
        );
        
        // Add debug tracking
        addMuteDebugAction('MUTE_APPLIED', targetPlayer.name, targetPlayer.id, duration, reason);
    }).catch(() => {
        window.gameRoom._room.sendAnnouncement("Error al mutear jugador", byPlayer.id, 0xFF7777, "normal", 2);
    });
}

registerCommand("mute", cmdMute, {
    helpText: "🔇 Mute a player",
    category: "Admin Commands",
    adminOnly: true
});