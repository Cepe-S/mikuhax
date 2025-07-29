import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { balanceTeams, getTeamsEloInfo, smartTeamBalance } from "../../model/OperateHelper/Quorum";
import * as LangRes from "../../resource/strings";

export function cmdBalance(byPlayer: PlayerObject): void {
    // Verificar permisos de administrador
    if (!byPlayer.admin && !window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    // Obtener información actual de los equipos
    const teamInfo = getTeamsEloInfo();
    const teamDifference = Math.abs(teamInfo.redCount - teamInfo.blueCount);
    
    // Mostrar estado actual
    window.gameRoom._room.sendAnnouncement(
        `⚖️ Estado - 🔴 ${teamInfo.redCount} (${teamInfo.redElo}) | 🔵 ${teamInfo.blueCount} (${teamInfo.blueElo})`,
        null, 0x00FFFF, "normal", 1
    );

    if (teamDifference === 0) {
        window.gameRoom._room.sendAnnouncement("✅ Equipos balanceados", null, 0x479947, "normal", 1);
        return;
    }

    // Ejecutar balanceo inteligente
    smartTeamBalance();
    window.gameRoom._room.sendAnnouncement(
        `🔄 ${byPlayer.name} ejecutó balanceo de equipos`,
        null, 0x479947, "normal", 1
    );

    window.gameRoom.logger.i('cmdBalance', `${byPlayer.name}#${byPlayer.id} forced team balance`);
}