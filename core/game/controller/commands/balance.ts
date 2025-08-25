import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { balanceTeams, getTeamsEloInfo } from "../../model/OperateHelper/Quorum";

function getSubteamDistribution(): string[] {
    const info: string[] = [];
    try {
        if (typeof (global as any).getSubteams === 'function') {
            const subteams = (global as any).getSubteams();
            const activePlayersList = window.gameRoom._room.getPlayerList()
                .filter((player: any) => player.id !== 0 && window.gameRoom.playerList.has(player.id));
            
            for (const [subteamName, subteam] of subteams) {
                let redCount = 0, blueCount = 0, specCount = 0;
                
                for (const player of activePlayersList) {
                    for (const memberName of subteam.members) {
                        if (player.name.toLowerCase().replace(/[_\s]/g, '') === memberName.toLowerCase().replace(/[_\s]/g, '')) {
                            if (player.team === 1) redCount++;
                            else if (player.team === 2) blueCount++;
                            else specCount++;
                            break;
                        }
                    }
                }
                
                if (redCount + blueCount + specCount > 0) {
                    let teamInfo = `${subteamName}(`;
                    if (redCount > 0) teamInfo += `🔴${redCount}`;
                    if (blueCount > 0) teamInfo += `🔵${blueCount}`;
                    if (specCount > 0) teamInfo += `⚪${specCount}`;
                    teamInfo += ')';
                    
                    // Marcar subteams divididos
                    const teamsWithMembers = [redCount > 0, blueCount > 0, specCount > 0].filter(Boolean).length;
                    if (teamsWithMembers > 1) {
                        teamInfo += ' ⚠️DIVIDIDO';
                    }
                    
                    info.push(teamInfo);
                }
            }
        }
    } catch (e) {}
    return info;
}
import * as LangRes from "../../resource/strings";
import { registerCommand } from "../CommandRegistry";

export function cmdBalance(byPlayer: PlayerObject): void {
    // Verificar permisos de administrador
    if (!byPlayer.admin && !window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    // Obtener información actual de los equipos
    const teamInfo = getTeamsEloInfo();
    const teamDifference = Math.abs(teamInfo.redCount - teamInfo.blueCount);
    const requiredPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;
    
    // Mostrar estado actual
    window.gameRoom._room.sendAnnouncement(
        `⚖️ ESTADO ACTUAL: 🔴${teamInfo.redCount}/${requiredPerTeam} vs 🔵${teamInfo.blueCount}/${requiredPerTeam} (diferencia: ${teamDifference})`,
        null, 0x00FFFF, "normal", 1
    );

    // Mostrar información de subteams activos
    const subteamInfo = getSubteamDistribution();
    if (subteamInfo.length > 0) {
        window.gameRoom._room.sendAnnouncement(
            `🏆 Subteams: ${subteamInfo.join(', ')}`,
            null, 0xFFD700, "normal", 1
        );
    }

    // Evaluar si se necesita balanceo
    const hasDividedSubteams = subteamInfo.some(info => info.includes('⚠️DIVIDIDO'));
    
    if (teamDifference <= 1 && !hasDividedSubteams) {
        window.gameRoom._room.sendAnnouncement(
            `✅ Equipos balanceados (diferencia ≤ 1, subteams unidos)`,
            null, 0x00FF00, "normal", 1
        );
        return;
    }
    
    if (teamDifference <= 1 && hasDividedSubteams) {
        window.gameRoom._room.sendAnnouncement(
            `🟡 Equipos numericamente balanceados pero hay subteams divididos`,
            null, 0xFFAA00, "normal", 1
        );
    }

    // Ejecutar balanceo
    let balanceReason = "";
    if (teamDifference > 1) {
        balanceReason = `diferencia de jugadores (${teamDifference})`;
    }
    if (hasDividedSubteams) {
        balanceReason += (balanceReason ? " y " : "") + "subteams divididos";
    }
    
    window.gameRoom._room.sendAnnouncement(
        `🔄 Balanceando equipos (${balanceReason})...`,
        null, 0xFF8800, "normal", 1
    );
    
    balanceTeams();
    
    setTimeout(() => {
        const newTeamInfo = getTeamsEloInfo();
        const newDifference = Math.abs(newTeamInfo.redCount - newTeamInfo.blueCount);
        const newSubteamInfo = getSubteamDistribution();
        const newHasDividedSubteams = newSubteamInfo.some(info => info.includes('⚠️DIVIDIDO'));
        
        let resultMessage = `✅ Balanceo completado: 🔴${newTeamInfo.redCount}/${requiredPerTeam} vs 🔵${newTeamInfo.blueCount}/${requiredPerTeam} (diferencia: ${newDifference})`;
        
        if (newHasDividedSubteams) {
            resultMessage += "\n⚠️ Algunos subteams siguen divididos (puede requerir balanceo manual)";
        } else if (newSubteamInfo.length > 0) {
            resultMessage += "\n🏆 Subteams reunificados exitosamente";
        }
        
        window.gameRoom._room.sendAnnouncement(
            resultMessage,
            null, newHasDividedSubteams ? 0xFFAA00 : 0x00FF00, "normal", 1
        );
    }, 500);

    window.gameRoom.logger.i('cmdBalance', `${byPlayer.name}#${byPlayer.id} executed team balance - reason: ${balanceReason}`);
}

// Register the command
registerCommand("balance", cmdBalance, {
    helpText: "⚖️ Balancea los equipos respetando subteams y ELO (solo administradores)",
    category: "Admin Commands",
    adminOnly: true
});