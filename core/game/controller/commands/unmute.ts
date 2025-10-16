import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

// Add mute debug tracking
function addMuteDebugAction(action: string, playerName: string, playerId: number, reason: string) {
    if (!window.gameRoom.muteDebugActions) {
        window.gameRoom.muteDebugActions = [];
    }
    
    window.gameRoom.muteDebugActions.unshift({
        timestamp: Date.now(),
        action,
        playerName,
        playerId,
        duration: 0,
        reason,
        expireTime: -1
    });
    
    // Keep only last 10 actions
    if (window.gameRoom.muteDebugActions.length > 10) {
        window.gameRoom.muteDebugActions = window.gameRoom.muteDebugActions.slice(0, 10);
    }
}

export function cmdUnmute(byPlayer: PlayerObject, message: string): void {
    const msgChunk = message.split(" ");
    if (msgChunk.length < 2) {
        window.gameRoom._room.sendAnnouncement("Uso: !unmute #ID o !unmute auth_del_jugador", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const targetStr = msgChunk[1];
    let targetAuth: string;
    let targetPlayer: any = null;

    if (targetStr.startsWith('#')) {
        const targetID = parseInt(targetStr.substr(1));
        if (isNaN(targetID) || !window.gameRoom.playerList.has(targetID)) {
            window.gameRoom._room.sendAnnouncement("Jugador no encontrado", byPlayer.id, 0xFF7777, "normal", 2);
            return;
        }
        targetPlayer = window.gameRoom.playerList.get(targetID)!;
        targetAuth = targetPlayer.auth;
    } else {
        targetAuth = targetStr;
    }

    window._deleteMuteByAuthDB(
        window.gameRoom.config._RUID,
        targetAuth
    ).then((success) => {
        if (success) {
            if (targetPlayer) {
                targetPlayer.permissions.mute = false;
                targetPlayer.permissions.muteExpire = -1;
                window.gameRoom._room.sendAnnouncement(`🔊 ${targetPlayer.name} ha sido desmuteado`, null, 0x00AA00, "bold", 1);
                addMuteDebugAction('MUTE_REMOVED', targetPlayer.name, targetPlayer.id, 'Manual unmute');
            } else {
                window.gameRoom._room.sendAnnouncement(`🔊 Mute removido para auth: ${targetAuth}`, byPlayer.id, 0x00AA00, "normal", 1);
                addMuteDebugAction('MUTE_REMOVED', 'Unknown Player', -1, `Manual unmute for auth: ${targetAuth}`);
            }
        } else {
            window.gameRoom._room.sendAnnouncement("No se encontró mute activo", byPlayer.id, 0xFF7777, "normal", 2);
        }
    }).catch(() => {
        window.gameRoom._room.sendAnnouncement("Error al remover mute", byPlayer.id, 0xFF7777, "normal", 2);
    });
}

registerCommand("unmute", cmdUnmute, {
    helpText: "🔊 Unmute a player",
    category: "Admin Commands",
    adminOnly: true
});