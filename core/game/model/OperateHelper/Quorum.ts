import { PlayerObject } from "../GameObject/PlayerObject";
import { TeamID } from "../GameObject/TeamID";
import { QueueSystem } from "./QueueSystem";

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

function recruitPlayers() {
    const queueSystem = QueueSystem.getInstance();
    
    // Check if queue is active and should handle recruitment
    if (queueSystem.shouldQueueBeActive()) {
        queueSystem.activateQueue();
        queueSystem.processQueue();
        return;
    }
    
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    const activeSpecPlayersList: PlayerObject[] = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Spec);

    const redCount = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red).length;
    const blueCount = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue).length;
    const requiredPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;

    const redNeeded = Math.max(0, requiredPerTeam - redCount);
    const blueNeeded = Math.max(0, requiredPerTeam - blueCount);

    let specIndex = 0;
    for(let i = 0; i < redNeeded && specIndex < activeSpecPlayersList.length; i++) {
        window.gameRoom._room.setPlayerTeam(activeSpecPlayersList[specIndex++].id, TeamID.Red);
    }
    for(let i = 0; i < blueNeeded && specIndex < activeSpecPlayersList.length; i++) {
        window.gameRoom._room.setPlayerTeam(activeSpecPlayersList[specIndex++].id, TeamID.Blue);
    }
}

export function assignPlayerToBalancedTeam(playerId: number) {
    if (!window.gameRoom.playerList.has(playerId)) return;
    
    const queueSystem = QueueSystem.getInstance();
    
    // Check if queue should be active
    if (queueSystem.shouldQueueBeActive()) {
        queueSystem.activateQueue();
        queueSystem.addPlayerToQueue(playerId);
        return;
    }
    
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.has(player.id) && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    
    const redCount = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red).length;
    const blueCount = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue).length;
    
    // Lógica determinística: siempre al equipo con menos jugadores, si empate entonces al rojo
    const targetTeam = redCount < blueCount ? TeamID.Red : 
                     blueCount < redCount ? TeamID.Blue : 
                     TeamID.Red; // Por defecto al rojo si están equilibrados
    
    window.gameRoom._room.setPlayerTeam(playerId, targetTeam);
}

export function shuffleTeamsByElo() {
    const queueSystem = QueueSystem.getInstance();
    
    // Don't shuffle if queue system should be active
    if (queueSystem.shouldQueueBeActive()) {
        window.gameRoom.logger.i('shuffleTeamsByElo', 'Cannot shuffle - queue system should be active');
        queueSystem.activateQueue();
        return;
    }
    
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList()
        .filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.has(player.id) && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    
    if (activePlayersList.length < 2) return;
    
    const sortedPlayers = activePlayersList.sort((a, b) => 
        window.gameRoom.playerList.get(b.id)!.stats.rating - window.gameRoom.playerList.get(a.id)!.stats.rating
    );
    
    sortedPlayers.forEach(player => window.gameRoom._room.setPlayerTeam(player.id, TeamID.Spec));
    
    setTimeout(() => {
        sortedPlayers.forEach((player, index) => {
            const team = index % 2 === 0 ? TeamID.Red : TeamID.Blue;
            window.gameRoom._room.setPlayerTeam(player.id, team);
        });
    }, 100);
}

export function balanceTeams() {
    const queueSystem = QueueSystem.getInstance();
    
    // Don't balance if queue system should be active - queue handles team assignment
    if (queueSystem.shouldQueueBeActive()) {
        window.gameRoom.logger.i('balanceTeams', 'Cannot balance - queue system should be active');
        queueSystem.activateQueue();
        queueSystem.processQueue();
        return;
    }
    
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.has(player.id) && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    
    const redPlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red);
    const bluePlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue);
    const specPlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Spec);
    
    const redCount = redPlayers.length;
    const blueCount = bluePlayers.length;
    const teamDifference = Math.abs(redCount - blueCount);
    
    if (teamDifference <= 1) return; // Solo balancear si hay diferencia de más de 1
    
    if (specPlayers.length > 0) {
        // Mover espectador al equipo con menos jugadores
        const targetTeam = redCount < blueCount ? TeamID.Red : TeamID.Blue;
        window.gameRoom._room.setPlayerTeam(specPlayers[0].id, targetTeam);
        window.gameRoom.logger.i('balanceTeams', `Moved spectator ${specPlayers[0].name} to ${targetTeam === TeamID.Red ? 'Red' : 'Blue'} team`);
    } else {
        // Mover jugador entre equipos solo si la diferencia es significativa
        if (redCount > blueCount + 1) {
            const playerToMove = redPlayers[Math.floor(Math.random() * redPlayers.length)];
            window.gameRoom._room.setPlayerTeam(playerToMove.id, TeamID.Blue);
            window.gameRoom.logger.i('balanceTeams', `Moved ${playerToMove.name} from Red to Blue team`);
        } else if (blueCount > redCount + 1) {
            const playerToMove = bluePlayers[Math.floor(Math.random() * bluePlayers.length)];
            window.gameRoom._room.setPlayerTeam(playerToMove.id, TeamID.Red);
            window.gameRoom.logger.i('balanceTeams', `Moved ${playerToMove.name} from Blue to Red team`);
        }
    }
}

/**
 * Obtiene información de ELO de los equipos para mostrar
 */
export function getTeamsEloInfo(): { redElo: number, blueElo: number, redCount: number, blueCount: number } {
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList()
        .filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.has(player.id) && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    
    const redPlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red);
    const bluePlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue);
    
    const redElo = redPlayers.reduce((total, player) => total + window.gameRoom.playerList.get(player.id)!.stats.rating, 0);
    const blueElo = bluePlayers.reduce((total, player) => total + window.gameRoom.playerList.get(player.id)!.stats.rating, 0);
    
    return {
        redElo,
        blueElo,
        redCount: redPlayers.length,
        blueCount: bluePlayers.length
    };
}

export function recuritByOne() {
    const activeSpecPlayersList: PlayerObject[] = fetchActiveSpecPlayers();
    if (activeSpecPlayersList.length > 0) {
        assignPlayerToBalancedTeam(activeSpecPlayersList[0].id);
    }
}

export function recuritBothTeamFully() {
    recruitPlayers();
}

export function balanceTeamsAfterLeave() {
    setTimeout(() => {
        smartTeamBalance();
    }, 500); // Usar la nueva función de balanceo inteligente
}

export function forceTeamBalance() {
    balanceTeams();
}

/**
 * Función mejorada para balancear equipos después de eventos de desconexión
 * Incluye verificaciones adicionales y logging detallado
 */
export function smartTeamBalance() {
    const queueSystem = QueueSystem.getInstance();
    
    // Check if queue should be active first
    if (queueSystem.shouldQueueBeActive()) {
        queueSystem.activateQueue();
        queueSystem.processQueue();
        return;
    }
    
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList()
        .filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.has(player.id) && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    
    const redPlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red);
    const bluePlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue);
    const specPlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Spec);
    
    const redCount = redPlayers.length;
    const blueCount = bluePlayers.length;
    const teamDifference = Math.abs(redCount - blueCount);
    
    window.gameRoom.logger.i('smartTeamBalance', `Current teams - Red: ${redCount}, Blue: ${blueCount}, Spec: ${specPlayers.length}, Difference: ${teamDifference}`);
    
    if (teamDifference <= 1) {
        window.gameRoom.logger.i('smartTeamBalance', 'Teams are balanced, no action needed');
        return;
    }
    
    // Intentar balancear con espectadores primero
    if (specPlayers.length > 0) {
        const targetTeam = redCount < blueCount ? TeamID.Red : TeamID.Blue;
        const playerToMove = specPlayers[0];
        window.gameRoom._room.setPlayerTeam(playerToMove.id, targetTeam);
        window.gameRoom.logger.i('smartTeamBalance', `Moved spectator ${playerToMove.name}#${playerToMove.id} to ${targetTeam === TeamID.Red ? 'Red' : 'Blue'} team`);
        
        // Anunciar el balanceo
        window.gameRoom._room.sendAnnouncement(
            `⚖️ Se han balanceado los equipos automáticamente ⚖️`,
            null, 0x00FFFF, "normal", 1
        );
    } else if (teamDifference > 1) {
        // Mover jugador entre equipos activos solo si la diferencia es mayor a 1
        if (redCount > blueCount + 1) {
            const playerToMove = redPlayers[Math.floor(Math.random() * redPlayers.length)];
            window.gameRoom._room.setPlayerTeam(playerToMove.id, TeamID.Blue);
            window.gameRoom.logger.i('smartTeamBalance', `Moved ${playerToMove.name}#${playerToMove.id} from Red to Blue team`);
            
            window.gameRoom._room.sendAnnouncement(
                `⚖️ Se han balanceado los equipos automáticamente ⚖️`,
                null, 0x00FFFF, "normal", 1
            );
        } else if (blueCount > redCount + 1) {
            const playerToMove = bluePlayers[Math.floor(Math.random() * bluePlayers.length)];
            window.gameRoom._room.setPlayerTeam(playerToMove.id, TeamID.Red);
            window.gameRoom.logger.i('smartTeamBalance', `Moved ${playerToMove.name}#${playerToMove.id} from Blue to Red team`);
            
            window.gameRoom._room.sendAnnouncement(
                `⚖️ Se han balanceado los equipos automáticamente ⚖️`,
                null, 0x00FFFF, "normal", 1
            );
        }
    }
}
