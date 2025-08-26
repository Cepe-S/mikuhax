import { PlayerObject } from "../GameObject/PlayerObject";
import { TeamID } from "../GameObject/TeamID";
import { QueueSystem } from "./QueueSystem";
import { TeamBalancer } from "./TeamBalancer";

export function roomPlayersNumberCheck(): number {
    return window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0).length;
}

export function roomActivePlayersNumberCheck(): number {
    return window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false).length;
}

export function roomTeamPlayersNumberCheck(team: TeamID): number {
    return window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && player.team === team).length;
}

export function fetchActiveSpecPlayers(): PlayerObject[] {
    return window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false && player.team === TeamID.Spec);
}

export function balanceTeams(): void {
    const queueSystem = QueueSystem.getInstance();
    
    if (queueSystem.shouldQueueBeActive()) {
        queueSystem.activateQueue();
        queueSystem.processQueue();
        return;
    }
    
    const teamBalancer = TeamBalancer.getInstance();
    teamBalancer.balanceTeams();
}

export function balanceAfterPlayerLeave(): void {
    const queueSystem = QueueSystem.getInstance();
    
    if (queueSystem.shouldQueueBeActive()) {
        queueSystem.activateQueue();
        queueSystem.processQueue();
        return;
    }
    
    const teamBalancer = TeamBalancer.getInstance();
    teamBalancer.balanceDuringMatch('player leave');
}

export function balanceDuringMatch(reason: string = 'unknown'): void {
    const queueSystem = QueueSystem.getInstance();
    
    if (queueSystem.shouldQueueBeActive()) {
        queueSystem.activateQueue();
        queueSystem.processQueue();
        return;
    }
    
    const teamBalancer = TeamBalancer.getInstance();
    teamBalancer.balanceDuringMatch(reason);
}

export function assignPlayerToBalancedTeam(playerId: number): void {
    const queueSystem = QueueSystem.getInstance();
    if (queueSystem.shouldQueueBeActive()) {
        queueSystem.activateQueue();
        queueSystem.addPlayerToQueue(playerId);
        return;
    }
    
    // Verificar si podemos hacer una asignación simple sin balanceo completo
    const currentPlayers = window.gameRoom._room.getPlayerList().filter(p => p.id !== 0);
    const redCount = currentPlayers.filter(p => p.team === TeamID.Red).length;
    const blueCount = currentPlayers.filter(p => p.team === TeamID.Blue).length;
    const requiredPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;
    const player = currentPlayers.find(p => p.id === playerId);
    
    if (player && player.team === TeamID.Spec) {
        // Si ambos equipos tienen espacio, asignar al que tenga menos jugadores
        if (redCount < requiredPerTeam && blueCount < requiredPerTeam) {
            const targetTeam = redCount <= blueCount ? TeamID.Red : TeamID.Blue;
            window.gameRoom._room.setPlayerTeam(playerId, targetTeam);
            window.gameRoom.logger.i('assignPlayerToBalancedTeam', 
                `Player ${playerId} assigned directly to ${targetTeam === TeamID.Red ? 'Red' : 'Blue'} team`);
            return;
        }
        
        // Si solo un equipo tiene espacio, asignar ahí
        if (redCount < requiredPerTeam && blueCount >= requiredPerTeam) {
            window.gameRoom._room.setPlayerTeam(playerId, TeamID.Red);
            window.gameRoom.logger.i('assignPlayerToBalancedTeam', `Player ${playerId} assigned to Red team (only available space)`);
            return;
        }
        
        if (blueCount < requiredPerTeam && redCount >= requiredPerTeam) {
            window.gameRoom._room.setPlayerTeam(playerId, TeamID.Blue);
            window.gameRoom.logger.i('assignPlayerToBalancedTeam', `Player ${playerId} assigned to Blue team (only available space)`);
            return;
        }
    }
    
    // Solo usar balanceo completo si es realmente necesario y no hay partida en curso
    if (window.gameRoom.isGamingNow === true) {
        // Durante partidas, usar balanceo conservador genérico
        balanceDuringMatch('player assignment');
    } else {
        // Entre partidas, usar balanceo completo
        balanceTeams();
    }
}



export function getTeamsEloInfo(): { redElo: number, blueElo: number, redCount: number, blueCount: number } {
    const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList()
        .filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.has(player.id) && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    
    const redPlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red);
    const bluePlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue);
    
    const redElo = redPlayers.reduce((total, player) => total + window.gameRoom.playerList.get(player.id)!.stats.rating, 0);
    const blueElo = bluePlayers.reduce((total, player) => total + window.gameRoom.playerList.get(player.id)!.stats.rating, 0);
    
    return { redElo, blueElo, redCount: redPlayers.length, blueCount: bluePlayers.length };
}
