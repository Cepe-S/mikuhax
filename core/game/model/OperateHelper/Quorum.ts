import { PlayerObject } from "../GameObject/PlayerObject";
import { TeamID } from "../GameObject/TeamID";

export function roomPlayersNumberCheck(): number {
    // return number of all players of this room (except bot host)
    return window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0).length;
}

export function roomActivePlayersNumberCheck(): number {
    // return number of players actually atcivated(not afk)
    return window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false).length;
}

export function roomTeamPlayersNumberCheck(team: TeamID): number {
    // return number of players in each team
    return window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && player.team === team).length;
}

export function fetchActiveSpecPlayers(): PlayerObject[] {
    return window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false && player.team === TeamID.Spec);
}

export function recuritByOne() {
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    const activeSpecPlayersList: PlayerObject[] = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Spec);

    const redInsufficiency: number = window.gameRoom.config.rules.requisite.eachTeamPlayers - activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red).length;
    const blueInsufficiency: number = window.gameRoom.config.rules.requisite.eachTeamPlayers - activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue).length;

    if(redInsufficiency >= blueInsufficiency && redInsufficiency > 0) {
        window.gameRoom._room.setPlayerTeam(activeSpecPlayersList[0].id, TeamID.Red);
    }
    if(redInsufficiency < blueInsufficiency && blueInsufficiency > 0) {
        window.gameRoom._room.setPlayerTeam(activeSpecPlayersList[0].id, TeamID.Blue);
    }
}

export function recuritBothTeamFully() {
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    let activeSpecPlayersList: PlayerObject[] = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Spec);

    const redInsufficiency: number = window.gameRoom.config.rules.requisite.eachTeamPlayers - activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red).length;
    const blueInsufficiency: number = window.gameRoom.config.rules.requisite.eachTeamPlayers - activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue).length;

    for(let i=0; i < redInsufficiency && i < activeSpecPlayersList.length; i++) {
        window.gameRoom._room.setPlayerTeam(activeSpecPlayersList[i].id, TeamID.Red);
    }

    activeSpecPlayersList = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false && player.team === TeamID.Spec);

    for(let i=0; i < blueInsufficiency && i < activeSpecPlayersList.length; i++) {
        window.gameRoom._room.setPlayerTeam(activeSpecPlayersList[i].id, TeamID.Blue);
    }
}

/**
 * Asigna un jugador al equipo con menos jugadores o aleatoriamente si están balanceados
 */
export function assignPlayerToBalancedTeam(playerId: number) {
    // Verificar que el jugador existe en la lista
    if (!window.gameRoom.playerList.has(playerId)) {
        window.gameRoom.logger.w('assignPlayerToBalancedTeam', `Player ${playerId} not found in playerList`);
        return;
    }
    
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.has(player.id) && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    
    const redPlayersCount: number = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red).length;
    const bluePlayersCount: number = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue).length;
    
    window.gameRoom.logger.i('assignPlayerToBalancedTeam', `Before assignment - Red: ${redPlayersCount}, Blue: ${bluePlayersCount}, Total players: ${activePlayersList.length}`);
    
    try {
        if (redPlayersCount < bluePlayersCount) {
            // Equipo rojo tiene menos jugadores
            window.gameRoom._room.setPlayerTeam(playerId, TeamID.Red);
            window.gameRoom.logger.i('assignPlayerToBalancedTeam', `Player ${playerId} assigned to Red team (Red: ${redPlayersCount}, Blue: ${bluePlayersCount})`);
        } else if (bluePlayersCount < redPlayersCount) {
            // Equipo azul tiene menos jugadores
            window.gameRoom._room.setPlayerTeam(playerId, TeamID.Blue);
            window.gameRoom.logger.i('assignPlayerToBalancedTeam', `Player ${playerId} assigned to Blue team (Red: ${redPlayersCount}, Blue: ${bluePlayersCount})`);
        } else {
            // Los equipos están balanceados, asignar aleatoriamente
            const randomTeam = Math.random() < 0.5 ? TeamID.Red : TeamID.Blue;
            window.gameRoom._room.setPlayerTeam(playerId, randomTeam);
            window.gameRoom.logger.i('assignPlayerToBalancedTeam', `Player ${playerId} assigned randomly to ${randomTeam === TeamID.Red ? 'Red' : 'Blue'} team (both teams balanced: ${redPlayersCount})`);
        }
    } catch (error) {
        window.gameRoom.logger.e('assignPlayerToBalancedTeam', `Failed to assign player ${playerId} to team: ${error}`);
    }
}

/**
 * Balancea los equipos después de que un jugador salga
 */
export function balanceTeamsAfterLeave() {
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    const activeSpecPlayersList: PlayerObject[] = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Spec);
    
    const redPlayersCount: number = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red).length;
    const bluePlayersCount: number = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue).length;
    
    const teamDifference = Math.abs(redPlayersCount - bluePlayersCount);
    
    // Solo balancear si hay una diferencia de más de 1 jugador y hay espectadores disponibles
    if (teamDifference > 1 && activeSpecPlayersList.length > 0) {
        if (redPlayersCount > bluePlayersCount) {
            // Mover un espectador al equipo azul
            window.gameRoom._room.setPlayerTeam(activeSpecPlayersList[0].id, TeamID.Blue);
            window.gameRoom.logger.i('balanceTeamsAfterLeave', `Moved player ${activeSpecPlayersList[0].id} to Blue team to balance (Red: ${redPlayersCount}, Blue: ${bluePlayersCount})`);
        } else if (bluePlayersCount > redPlayersCount) {
            // Mover un espectador al equipo rojo
            window.gameRoom._room.setPlayerTeam(activeSpecPlayersList[0].id, TeamID.Red);
            window.gameRoom.logger.i('balanceTeamsAfterLeave', `Moved player ${activeSpecPlayersList[0].id} to Red team to balance (Red: ${redPlayersCount}, Blue: ${bluePlayersCount})`);
        }
    }
}
