import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getTeamsEloInfo } from "../../model/OperateHelper/Quorum";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import { registerCommand } from "../CommandRegistry";

export function cmdTeamStatus(byPlayer: PlayerObject): void {
    // Verificar permisos de administrador
    if (!byPlayer.admin && !window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    // Obtener información de equipos
    const teamInfo = getTeamsEloInfo();
    const teamDifference = Math.abs(teamInfo.redCount - teamInfo.blueCount);
    
    let message = `📊 ESTADO DE EQUIPOS 📊\n`;
    message += `🔴 Rojos: ${teamInfo.redCount} jugadores (ELO: ${teamInfo.redElo})\n`;
    message += `🔵 Azules: ${teamInfo.blueCount} jugadores (ELO: ${teamInfo.blueElo})\n`;
    message += `⚖️ Diferencia: ${teamDifference} jugador${teamDifference !== 1 ? 'es' : ''}\n`;
    
    // Obtener información de subteams
    const subteamDetails = getDetailedSubteamInfo();
    if (subteamDetails.length > 0) {
        message += `\n🏆 SUBTEAMS ACTIVOS:\n`;
        message += subteamDetails.join('\n');
    } else {
        message += `\n🏆 No hay subteams activos`;
    }
    
    // Estado de balanceo
    message += `\n\n⚖️ ESTADO DE BALANCEO:\n`;
    if (teamDifference === 0) {
        message += `✅ Equipos perfectamente balanceados`;
    } else if (teamDifference === 1) {
        message += `🟡 Diferencia mínima (aceptable)`;
    } else {
        message += `🔴 Equipos desbalanceados (diferencia: ${teamDifference})`;
        
        // Verificar si se puede balancear sin romper subteams
        const canBalance = checkIfCanBalanceWithoutBreakingSubteams();
        if (canBalance) {
            message += `\n✅ Se puede balancear respetando subteams`;
        } else {
            message += `\n⚠️ Balanceo requeriría separar subteams`;
        }
    }

    window.gameRoom._room.sendAnnouncement(message, byPlayer.id, 0x00FFFF, "normal", 1);
    window.gameRoom.logger.i('cmdTeamStatus', `${byPlayer.name}#${byPlayer.id} checked team status`);
}

function getDetailedSubteamInfo(): string[] {
    const details: string[] = [];
    try {
        if (typeof (global as any).getSubteams === 'function') {
            const subteams = (global as any).getSubteams();
            const activePlayersList = window.gameRoom._room.getPlayerList()
                .filter((player: any) => player.id !== 0 && window.gameRoom.playerList.has(player.id));
            
            for (const [subteamName, subteam] of subteams) {
                const redMembers: string[] = [];
                const blueMembers: string[] = [];
                const specMembers: string[] = [];
                
                for (const player of activePlayersList) {
                    for (const memberName of subteam.members) {
                        if (normalizePlayerName(player.name) === normalizePlayerName(memberName)) {
                            if (player.team === TeamID.Red) redMembers.push(player.name);
                            else if (player.team === TeamID.Blue) blueMembers.push(player.name);
                            else specMembers.push(player.name);
                            break;
                        }
                    }
                }
                
                if (redMembers.length + blueMembers.length + specMembers.length > 0) {
                    let detail = `  🏆 ${subteamName}: `;
                    const parts: string[] = [];
                    if (redMembers.length > 0) parts.push(`🔴${redMembers.join(', ')}`);
                    if (blueMembers.length > 0) parts.push(`🔵${blueMembers.join(', ')}`);
                    if (specMembers.length > 0) parts.push(`⚪${specMembers.join(', ')}`);
                    detail += parts.join(' | ');
                    
                    // Indicar si el subteam está dividido
                    const teamsWithMembers = [redMembers.length > 0, blueMembers.length > 0, specMembers.length > 0].filter(Boolean).length;
                    if (teamsWithMembers > 1) {
                        detail += ` ⚠️ DIVIDIDO`;
                    } else {
                        detail += ` ✅ UNIDO`;
                    }
                    
                    details.push(detail);
                }
            }
        }
    } catch (e) {
        details.push(`  ❌ Error obteniendo información de subteams`);
    }
    return details;
}

function checkIfCanBalanceWithoutBreakingSubteams(): boolean {
    try {
        const activePlayersList = window.gameRoom._room.getPlayerList()
            .filter((player: any) => player.id !== 0 && window.gameRoom.playerList.has(player.id) && 
                     window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
        
        const redPlayers = activePlayersList.filter((player: any) => player.team === TeamID.Red);
        const bluePlayers = activePlayersList.filter((player: any) => player.team === TeamID.Blue);
        const specPlayers = activePlayersList.filter((player: any) => player.team === TeamID.Spec);
        
        const redCount = redPlayers.length;
        const blueCount = bluePlayers.length;
        
        // Si hay espectadores, siempre se puede balancear
        if (specPlayers.length > 0) return true;
        
        // Verificar si hay jugadores que se pueden mover sin romper subteams
        if (redCount > blueCount + 1) {
            // Necesitamos mover de rojo a azul
            for (const player of redPlayers) {
                if (canMovePlayerSafely(player.name, player.team, TeamID.Blue)) {
                    return true;
                }
            }
        } else if (blueCount > redCount + 1) {
            // Necesitamos mover de azul a rojo
            for (const player of bluePlayers) {
                if (canMovePlayerSafely(player.name, player.team, TeamID.Red)) {
                    return true;
                }
            }
        }
        
        return false;
    } catch (e) {
        return false;
    }
}

function canMovePlayerSafely(playerName: string, fromTeam: TeamID, toTeam: TeamID): boolean {
    try {
        if (typeof (global as any).getPlayerSubteam === 'function') {
            const subteam = (global as any).getPlayerSubteam(playerName);
            if (!subteam) return true; // No subteam, safe to move
            
            // Check if moving would break subteam cohesion
            const activePlayersList = window.gameRoom._room.getPlayerList()
                .filter((player: any) => player.id !== 0 && window.gameRoom.playerList.has(player.id));
            
            let membersInFromTeam = 0;
            let membersInToTeam = 0;
            
            for (const player of activePlayersList) {
                for (const memberName of subteam.members) {
                    if (normalizePlayerName(memberName) === normalizePlayerName(player.name)) {
                        if (player.team === fromTeam) membersInFromTeam++;
                        else if (player.team === toTeam) membersInToTeam++;
                        break;
                    }
                }
            }
            
            // Safe to move if:
            // 1. Player would join subteam members in target team
            // 2. Player is the only subteam member in source team
            return membersInToTeam > 0 || membersInFromTeam === 1;
        }
    } catch (e) {
        // Error checking, assume unsafe
        return false;
    }
    return true; // No subteam system, safe to move
}

function normalizePlayerName(name: string): string {
    return name.toLowerCase().replace(/[_\s]/g, '');
}

// Register the command
registerCommand("teamstatus", cmdTeamStatus, {
    helpText: "📊 Muestra estado detallado de equipos y subteams (solo administradores)",
    category: "Admin Commands",
    adminOnly: true
});