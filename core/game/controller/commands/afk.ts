import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import { registerCommand } from "../CommandRegistry";
import { command } from "../../resource/strings";

export function cmdAfk(byPlayer: PlayerObject, fullMessage?: string): void {
    const playerData = window.gameRoom.playerList.get(byPlayer.id);
    if (!playerData) return;

    const msgChunk = fullMessage ? fullMessage.split(" ") : [];
    const reason = msgChunk.slice(1).join(" ") || "";

    if (playerData.permissions.afkmode) {
        // Desactivar AFK - equivalente a onPlayerJoin
        playerData.permissions.afkmode = false;
        playerData.permissions.afkreason = "";
        playerData.permissions.afkdate = 0;
        
        const unAfkMsg = command.afk.unAfk
            .replace('{targetName}', byPlayer.name)
            .replace('{ticketTarget}', byPlayer.id.toString());
        window.gameRoom._room.sendAnnouncement(unAfkMsg, null, 0x00AA00, "normal", 1);
        
        // Trigger balance system as if player joined
        if (window.gameRoom.config.rules.autoOperating === true) {
            window.gameRoom.balanceManager.onPlayerAfkChange(byPlayer, false);
        }
    } else {
        // Activar AFK - equivalente a onPlayerLeave
        const wasInTeam = byPlayer.team !== TeamID.Spec;
        
        // Set AFK status first
        playerData.permissions.afkmode = true;
        playerData.permissions.afkreason = reason;
        playerData.permissions.afkdate = Date.now();
        
        // Mover a espectador si está en un equipo
        if (wasInTeam) {
            window.gameRoom._room.setPlayerTeam(byPlayer.id, TeamID.Spec);
        }
        
        const setAfkMsg = command.afk.setAfk
            .replace('{targetName}', byPlayer.name)
            .replace('{ticketTarget}', byPlayer.id.toString())
            .replace('{targetAfkReason}', reason ? ` (${reason})` : '');
        window.gameRoom._room.sendAnnouncement(setAfkMsg, null, 0xFFD700, "normal", 1);
        
        // Trigger balance system only if player was in a team
        if (window.gameRoom.config.rules.autoOperating === true && wasInTeam) {
            window.gameRoom.balanceManager.onPlayerAfkChange(byPlayer, true);
        }
        
        // Advertir sobre el tiempo límite si está habilitado
        if (window.gameRoom.config.settings.afkCommandAutoKick) {
            const minutes = Math.floor(window.gameRoom.config.settings.afkCommandAutoKickAllowMillisecs / 60000);
            window.gameRoom._room.sendAnnouncement(
                `⏰ Serás expulsado automáticamente si permaneces AFK por más de ${minutes} minutos.`,
                byPlayer.id,
                0xFF7777,
                "normal",
                1
            );
        }
    }
}

registerCommand("afk", cmdAfk, {
    helpText: "Activa/desactiva el modo AFK. Uso: !afk [razón]",
    category: "Basic Commands"
});
