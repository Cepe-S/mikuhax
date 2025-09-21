import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import { registerCommand } from "../CommandRegistry";

export function cmdTeamStatus(byPlayer: PlayerObject): void {
    // Verificar permisos de administrador
    if (!byPlayer.admin && !window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    // Obtener información básica de equipos
    const players = window.gameRoom._room.getPlayerList();
    let redCount = 0, blueCount = 0, specCount = 0;
    
    players.forEach(player => {
        if (player.team === TeamID.Red) redCount++;
        else if (player.team === TeamID.Blue) blueCount++;
        else if (player.team === TeamID.Spec) specCount++;
    });
    
    const teamDifference = Math.abs(redCount - blueCount);
    
    let message = `📊 ESTADO DE EQUIPOS 📊\n`;
    message += `🔴 Rojos: ${redCount} jugadores\n`;
    message += `🔵 Azules: ${blueCount} jugadores\n`;
    message += `⚪ Espectadores: ${specCount} jugadores\n`;
    message += `⚖️ Diferencia: ${teamDifference} jugador${teamDifference !== 1 ? 'es' : ''}\n`;
    
    // Estado de balanceo
    message += `\n⚖️ ESTADO DE BALANCEO:\n`;
    if (teamDifference === 0) {
        message += `✅ Equipos perfectamente balanceados`;
    } else if (teamDifference === 1) {
        message += `🟡 Diferencia mínima (aceptable)`;
    } else {
        message += `🔴 Equipos desbalanceados (diferencia: ${teamDifference})`;
    }

    window.gameRoom._room.sendAnnouncement(message, byPlayer.id, 0x00FFFF, "normal", 1);
    window.gameRoom.logger.i('cmdTeamStatus', `${byPlayer.name}#${byPlayer.id} checked team status`);
}



// Register the command
registerCommand("teamstatus", cmdTeamStatus, {
    helpText: "📊 Muestra estado detallado de equipos y subteams (solo administradores)",
    category: "Admin Commands",
    adminOnly: true
});