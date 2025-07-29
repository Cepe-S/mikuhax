import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getTeamsEloInfo } from "../../model/OperateHelper/Quorum";

export function cmdScout(byPlayer: PlayerObject): void {
    if (window.gameRoom.config.rules.statsRecord == true && window.gameRoom.isStatRecord == true) {
        const teamsInfo = getTeamsEloInfo();
        
        const redEloMsg = `🔴 Equipo Rojo: ${teamsInfo.redCount} jugadores | ELO Total: ${teamsInfo.redElo} | Promedio: ${teamsInfo.redCount > 0 ? Math.round(teamsInfo.redElo / teamsInfo.redCount) : 0}`;
        const blueEloMsg = `🔵 Equipo Azul: ${teamsInfo.blueCount} jugadores | ELO Total: ${teamsInfo.blueElo} | Promedio: ${teamsInfo.blueCount > 0 ? Math.round(teamsInfo.blueElo / teamsInfo.blueCount) : 0}`;
        const balanceMsg = `⚖️ Diferencia de ELO: ${Math.abs(teamsInfo.redElo - teamsInfo.blueElo)} puntos`;
        
        window.gameRoom._room.sendAnnouncement("📊 Análisis de Equipos:", byPlayer.id, 0x479947, "normal", 1);
        window.gameRoom._room.sendAnnouncement(redEloMsg, byPlayer.id, 0xFF3333, "normal", 0);
        window.gameRoom._room.sendAnnouncement(blueEloMsg, byPlayer.id, 0x3399FF, "normal", 0);
        window.gameRoom._room.sendAnnouncement(balanceMsg, byPlayer.id, 0xFFFF00, "normal", 0);
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.scout._ErrorNoMode, byPlayer.id, 0xFF7777, "normal", 2);
    }
}