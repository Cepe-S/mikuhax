import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import { registerCommand } from "../CommandRegistry";

export function cmdReunify(byPlayer: PlayerObject): void {
    // Verificar permisos de administrador
    if (!byPlayer.admin && !window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const dividedSubteams = findDividedSubteams();
    
    if (dividedSubteams.length === 0) {
        window.gameRoom._room.sendAnnouncement(
            "✅ No hay subteams divididos que reunificar",
            byPlayer.id, 0x00FF00, "normal", 1
        );
        return;
    }

    window.gameRoom._room.sendAnnouncement(
        `🔄 Reunificando ${dividedSubteams.length} subteam(s) dividido(s)...`,
        null, 0xFF8800, "normal", 1
    );

    let reunified = 0;
    const requiredPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;

    for (const subteamInfo of dividedSubteams) {
        const success = reunifySubteam(subteamInfo, requiredPerTeam);
        if (success) {
            reunified++;
            window.gameRoom.logger.i('cmdReunify', `Reunified subteam '${subteamInfo.name}' - moved ${subteamInfo.minorityMembers.length} player(s) to ${subteamInfo.majorityTeam === TeamID.Red ? 'Red' : 'Blue'}`);
        }
    }

    setTimeout(() => {
        const newDividedSubteams = findDividedSubteams();
        let resultMessage = `✅ Reunificación completada: ${reunified}/${dividedSubteams.length} subteams reunificados`;
        
        if (newDividedSubteams.length > 0) {
            resultMessage += `\n⚠️ ${newDividedSubteams.length} subteam(s) no pudieron ser reunificados (límites de equipo)`;
        }

        window.gameRoom._room.sendAnnouncement(
            resultMessage,
            null, newDividedSubteams.length > 0 ? 0xFFAA00 : 0x00FF00, "normal", 1
        );
    }, 500);

    window.gameRoom.logger.i('cmdReunify', `${byPlayer.name}#${byPlayer.id} executed subteam reunification`);
}

interface DividedSubteamInfo {
    name: string;
    majorityTeam: TeamID;
    minorityTeam: TeamID;
    majorityMembers: PlayerObject[];
    minorityMembers: PlayerObject[];
}

function findDividedSubteams(): DividedSubteamInfo[] {
    const dividedSubteams: DividedSubteamInfo[] = [];
    
    try {
        if (typeof (global as any).getSubteams === 'function') {
            const subteams = (global as any).getSubteams();
            const activePlayersList = window.gameRoom._room.getPlayerList()
                .filter((player: PlayerObject) => player.id !== 0 && 
                        window.gameRoom.playerList.has(player.id) && 
                        !window.gameRoom.playerList.get(player.id)!.permissions.afkmode);
            
            for (const [subteamName, subteam] of subteams) {
                const redMembers: PlayerObject[] = [];
                const blueMembers: PlayerObject[] = [];
                
                // Encontrar miembros del subteam en cada equipo
                for (const player of activePlayersList) {
                    if (player.team === TeamID.Red || player.team === TeamID.Blue) {
                        for (const memberName of subteam.members) {
                            if (memberName.toLowerCase().replace(/[_\s]/g, '') === player.name.toLowerCase().replace(/[_\s]/g, '')) {
                                if (player.team === TeamID.Red) redMembers.push(player);
                                else blueMembers.push(player);
                                break;
                            }
                        }
                    }
                }
                
                // Si el subteam está dividido entre ambos equipos
                if (redMembers.length > 0 && blueMembers.length > 0) {
                    const majorityTeam = redMembers.length >= blueMembers.length ? TeamID.Red : TeamID.Blue;
                    const minorityTeam = majorityTeam === TeamID.Red ? TeamID.Blue : TeamID.Red;
                    const majorityMembers = majorityTeam === TeamID.Red ? redMembers : blueMembers;
                    const minorityMembers = majorityTeam === TeamID.Red ? blueMembers : redMembers;
                    
                    dividedSubteams.push({
                        name: subteamName,
                        majorityTeam,
                        minorityTeam,
                        majorityMembers,
                        minorityMembers
                    });
                }
            }
        }
    } catch (e) {
        window.gameRoom.logger.e('findDividedSubteams', `Error: ${e}`);
    }
    
    return dividedSubteams;
}

function reunifySubteam(subteamInfo: DividedSubteamInfo, requiredPerTeam: number): boolean {
    const activePlayersList = window.gameRoom._room.getPlayerList()
        .filter((player: PlayerObject) => player.id !== 0 && 
                window.gameRoom.playerList.has(player.id) && 
                !window.gameRoom.playerList.get(player.id)!.permissions.afkmode);
    
    const majorityTeamCount = activePlayersList.filter(p => p.team === subteamInfo.majorityTeam).length;
    const minorityTeamCount = activePlayersList.filter(p => p.team === subteamInfo.minorityTeam).length;
    
    // Verificar si hay espacio en el equipo mayoritario
    const spaceInMajorityTeam = requiredPerTeam - majorityTeamCount;
    const playersToMove = Math.min(subteamInfo.minorityMembers.length, spaceInMajorityTeam);
    
    if (playersToMove <= 0) {
        window.gameRoom.logger.w('reunifySubteam', `Cannot reunify ${subteamInfo.name} - no space in majority team (${majorityTeamCount}/${requiredPerTeam})`);
        return false;
    }
    
    // Mover jugadores de la minoría al equipo mayoritario
    for (let i = 0; i < playersToMove; i++) {
        const playerToMove = subteamInfo.minorityMembers[i];
        window.gameRoom._room.setPlayerTeam(playerToMove.id, subteamInfo.majorityTeam);
        
        window.gameRoom.logger.i('reunifySubteam', 
            `Moved ${playerToMove.name} from ${subteamInfo.minorityTeam === TeamID.Red ? 'Red' : 'Blue'} to ${subteamInfo.majorityTeam === TeamID.Red ? 'Red' : 'Blue'} to reunify subteam '${subteamInfo.name}'`);
    }
    
    return playersToMove === subteamInfo.minorityMembers.length;
}

// Register the command
registerCommand("reunify", cmdReunify, {
    helpText: "🤝 Reunifica subteams divididos entre equipos (solo administradores)",
    category: "Admin Commands",
    adminOnly: true
});