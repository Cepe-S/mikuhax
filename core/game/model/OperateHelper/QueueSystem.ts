import { PlayerObject } from "../GameObject/PlayerObject";
import { TeamID } from "../GameObject/TeamID";
import { getUnixTimestamp } from "../../controller/Statistics";

export interface QueuePlayer {
    playerId: number;
    playerName: string;
    queuePosition: number;
    entryTime: number; // timestamp when added to queue
}

export class QueueSystem {
    private static instance: QueueSystem;
    private queue: QueuePlayer[] = [];
    private isQueueActive: boolean = false;
    private nextPosition: number = 1;

    private constructor() {}

    public static getInstance(): QueueSystem {
        if (!QueueSystem.instance) {
            QueueSystem.instance = new QueueSystem();
        }
        return QueueSystem.instance;
    }

    /**
     * Checks if queue should be active based on player count
     */
    public shouldQueueBeActive(): boolean {
        const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList()
            .filter((player: PlayerObject) => player.id !== 0 && 
                    window.gameRoom.playerList.has(player.id) && 
                    window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
        
        const maxPlayersPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;
        const maxTotalPlayers = maxPlayersPerTeam * 2;
        
        const shouldBeActive = activePlayersList.length > maxTotalPlayers;
        
        window.gameRoom.logger.i('QueueSystem', `ShouldQueueBeActive: totalPlayers=${activePlayersList.length}, maxTotal=${maxTotalPlayers}, shouldBeActive=${shouldBeActive}`);
        
        return shouldBeActive;
    }

    /**
     * Activates the queue system when player limit is exceeded
     */
    public activateQueue(): void {
        if (!this.isQueueActive && this.shouldQueueBeActive()) {
            this.isQueueActive = true;
            window.gameRoom.logger.i('QueueSystem', 'Queue system activated - player limit exceeded');
            window.gameRoom._room.sendAnnouncement(
                "🎯 Sistema de cola activado - Hay más jugadores que espacios disponibles",
                null, 0xFFD700, "normal", 1
            );
        } else if (this.isQueueActive) {
            window.gameRoom.logger.i('QueueSystem', 'Queue system already active');
        } else {
            window.gameRoom.logger.i('QueueSystem', 'Queue system activation skipped - not needed');
        }
    }

    /**
     * Deactivates the queue system when there's enough space
     */
    public deactivateQueue(): void {
        if (this.isQueueActive && !this.shouldQueueBeActive()) {
            this.isQueueActive = false;
            this.queue = [];
            this.nextPosition = 1;
            window.gameRoom.logger.i('QueueSystem', 'Queue system deactivated - enough space for all players');
            window.gameRoom._room.sendAnnouncement(
                "✅ Sistema de cola desactivado - Hay espacio para todos los jugadores",
                null, 0x00FF00, "normal", 1
            );
        }
    }

    /**
     * Adds a player to the queue
     */
    public addPlayerToQueue(playerId: number): void {
        if (!this.isQueueActive) return;

        const player = window.gameRoom._room.getPlayerList().find(p => p.id === playerId);
        if (!player) return;

        // Check if player is already in queue
        if (this.queue.find(qp => qp.playerId === playerId)) return;

        const queuePlayer: QueuePlayer = {
            playerId: playerId,
            playerName: player.name,
            queuePosition: this.nextPosition++,
            entryTime: getUnixTimestamp()
        };

        this.queue.push(queuePlayer);
        this.sortQueue();

        window.gameRoom.logger.i('QueueSystem', `Player ${player.name}#${playerId} added to queue at position ${queuePlayer.queuePosition}`);
        
        // Notify player of their queue position
        this.notifyPlayerPosition(playerId);
    }

    /**
     * Adds losing team players to queue in random positions
     */
    public addLosingTeamToQueue(losingTeamId: TeamID): void {
        if (!this.isQueueActive) return;

        const losingPlayers = window.gameRoom._room.getPlayerList()
            .filter((player: PlayerObject) => player.team === losingTeamId && player.id !== 0);

        if (losingPlayers.length === 0) return;

        window.gameRoom.logger.i('QueueSystem', `Adding ${losingPlayers.length} losing team players to queue`);

        // Generate random positions for losing players
        const availablePositions: number[] = [];
        for (let i = this.nextPosition; i < this.nextPosition + losingPlayers.length; i++) {
            availablePositions.push(i);
        }

        // Shuffle positions randomly
        for (let i = availablePositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
        }

        const currentTime = getUnixTimestamp();
        losingPlayers.forEach((player, index) => {
            // Remove if already in queue
            this.removePlayerFromQueue(player.id);

            const queuePlayer: QueuePlayer = {
                playerId: player.id,
                playerName: player.name,
                queuePosition: availablePositions[index],
                entryTime: currentTime
            };

            this.queue.push(queuePlayer);
            
            // NO mover jugadores a espectadores - mantenerlos en sus equipos hasta que sea su turno
            window.gameRoom.logger.i('QueueSystem', `Player ${player.name}#${player.id} added to queue at position ${queuePlayer.queuePosition} (staying in current team until queue processes)`);
        });

        this.nextPosition += losingPlayers.length;
        this.sortQueue();

        window.gameRoom.logger.i('QueueSystem', `Added ${losingPlayers.length} losing team players to queue without moving to spectators. Total queue size: ${this.queue.length}`);
        
        // Notify all players in queue of their positions
        setTimeout(() => {
            this.notifyAllQueuePositions();
        }, 500);
    }

    /**
     * Gets the next player from the queue to join a team
     */
    public getNextPlayerFromQueue(): PlayerObject | null {
        if (!this.isQueueActive || this.queue.length === 0) return null;

        // Sort queue to ensure correct order
        this.sortQueue();

        // Get player with lowest position number
        const nextQueuePlayer = this.queue[0];
        const player = window.gameRoom._room.getPlayerList().find(p => p.id === nextQueuePlayer.playerId);

        if (player) {
            this.removePlayerFromQueue(nextQueuePlayer.playerId);
            window.gameRoom.logger.i('QueueSystem', `Player ${player.name}#${player.id} removed from queue - joining game`);
            return player;
        }

        return null;
    }

    /**
     * Removes a player from the queue
     */
    public removePlayerFromQueue(playerId: number): void {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(qp => qp.playerId !== playerId);
        
        if (this.queue.length !== initialLength) {
            window.gameRoom.logger.i('QueueSystem', `Player #${playerId} removed from queue`);
        }
    }

    /**
     * Gets a player's position in the queue
     */
    public getPlayerQueuePosition(playerId: number): number | null {
        const queuePlayer = this.queue.find(qp => qp.playerId === playerId);
        if (!queuePlayer) return null;

        this.sortQueue();
        return this.queue.findIndex(qp => qp.playerId === playerId) + 1;
    }

    /**
     * Notifies a player of their queue position
     */
    public notifyPlayerPosition(playerId: number): void {
        const position = this.getPlayerQueuePosition(playerId);
        if (position === null) return;

        const queueSize = this.queue.length;
        window.gameRoom._room.sendAnnouncement(
            `🎯 Tu posición en la cola: ${position}/${queueSize} - Usa !cola para ver tu estado`,
            playerId, 0xFFD700, "normal", 1
        );
    }

    /**
     * Notifies all players in queue of their positions
     */
    public notifyAllQueuePositions(): void {
        if (!this.isQueueActive) return;

        this.queue.forEach(queuePlayer => {
            this.notifyPlayerPosition(queuePlayer.playerId);
        });
    }

    /**
     * Shows queue status to a player
     */
    public showQueueStatus(playerId: number): void {
        if (!this.isQueueActive) {
            window.gameRoom._room.sendAnnouncement(
                "ℹ️ El sistema de cola no está activo - hay espacio suficiente para todos",
                playerId, 0x00AAFF, "normal", 1
            );
            return;
        }

        const position = this.getPlayerQueuePosition(playerId);
        if (position === null) {
            window.gameRoom._room.sendAnnouncement(
                "ℹ️ No estás en la cola - estás jugando o hay espacio disponible",
                playerId, 0x00AAFF, "normal", 1
            );
            return;
        }

        const queueSize = this.queue.length;
        let message = `🎯 ESTADO DE LA COLA:\n`;
        message += `📍 Tu posición: ${position}/${queueSize}\n`;
        message += `⏳ Jugadores delante de ti: ${position - 1}\n`;
        message += `💡 Los ganadores siguen jugando, los perdedores van a la cola`;

        window.gameRoom._room.sendAnnouncement(
            message, playerId, 0xFFD700, "normal", 1
        );
    }

    /**
     * Shows full queue to admins
     */
    public showFullQueue(playerId: number): void {
        const player = window.gameRoom.playerList.get(playerId);
        if (!player || (!player.admin && !player.permissions.superadmin)) {
            window.gameRoom._room.sendAnnouncement(
                "❌ Solo los administradores pueden ver la cola completa",
                playerId, 0xFF0000, "normal", 1
            );
            return;
        }

        if (!this.isQueueActive) {
            window.gameRoom._room.sendAnnouncement(
                "ℹ️ El sistema de cola no está activo",
                playerId, 0x00AAFF, "normal", 1
            );
            return;
        }

        this.sortQueue();
        let message = `🎯 COLA COMPLETA (${this.queue.length} jugadores):\n`;
        
        this.queue.slice(0, 10).forEach((queuePlayer, index) => {
            message += `${index + 1}. ${queuePlayer.playerName}#${queuePlayer.playerId}\n`;
        });

        if (this.queue.length > 10) {
            message += `... y ${this.queue.length - 10} más`;
        }

        window.gameRoom._room.sendAnnouncement(
            message, playerId, 0xFFD700, "normal", 1
        );
    }

    /**
     * Sorts the queue by position number
     */
    private sortQueue(): void {
        this.queue.sort((a, b) => a.queuePosition - b.queuePosition);
    }
    
    /**
     * Normalizes player names for comparison
     */
    private normalizePlayerName(name: string): string {
        return name.toLowerCase().replace(/[_\s]/g, '');
    }

    /**
     * Handles when a player goes AFK and creates space in teams
     */
    public onPlayerGoesAFK(playerId: number): void {
        if (!this.isQueueActive) return;

        const player = window.gameRoom._room.getPlayerList().find(p => p.id === playerId);
        if (!player || player.team === TeamID.Spec) return; // Only care about team players going AFK

        window.gameRoom.logger.i('QueueSystem', `Player ${player.name}#${playerId} went AFK from ${player.team === TeamID.Red ? 'Red' : 'Blue'} team - processing queue`);
        
        // Remove from queue if they were somehow in it
        this.removePlayerFromQueue(playerId);
        
        // Process queue immediately to fill the AFK player's spot
        setTimeout(() => {
            this.processQueue();
            window.gameRoom.logger.i('QueueSystem', 'Queue processed after player went AFK');
        }, 500); // Small delay to ensure team change is processed
    }

    /**
     * Handles when a player returns from AFK
     */
    public onPlayerReturnsFromAFK(playerId: number): boolean {
        const queueSystem = QueueSystem.getInstance();
        
        // Check if queue should be active before assigning team
        if (queueSystem.shouldQueueBeActive()) {
            // If queue is active, add returning player to queue instead of direct team assignment
            queueSystem.activateQueue();
            queueSystem.addPlayerToQueue(playerId);
            
            const player = window.gameRoom._room.getPlayerList().find(p => p.id === playerId);
            window.gameRoom.logger.i('QueueSystem', `Player ${player?.name}#${playerId} returned from AFK - added to queue instead of direct team assignment`);
            
            // Notify player they've been added to queue
            if (player) {
                window.gameRoom._room.sendAnnouncement(
                    "🎯 Has regresado de AFK pero los equipos están llenos - has sido añadido a la cola",
                    playerId, 0xFFD700, "normal", 1
                );
                
                setTimeout(() => {
                    this.notifyPlayerPosition(playerId);
                }, 1000);
            }
            
            return true; // Indicate that queue system handled the assignment
        }
        
        return false; // Queue system doesn't need to handle it
    }

    /**
     * Gets the current queue status
     */
    public getQueueInfo(): { isActive: boolean, queueSize: number, nextPosition: number } {
        return {
            isActive: this.isQueueActive,
            queueSize: this.queue.length,
            nextPosition: this.nextPosition
        };
    }

    /**
     * Debug function to show current game state and queue status
     */
    public debugStatus(): void {
        const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList()
            .filter((player: PlayerObject) => player.id !== 0 && 
                    window.gameRoom.playerList.has(player.id) && 
                    window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);

        const redPlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red);
        const bluePlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue);
        const specPlayers = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Spec);

        const maxPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;

        window.gameRoom.logger.i('QueueSystem-Debug', 
            `Game State: Red=${redPlayers.length}/${maxPerTeam}, Blue=${bluePlayers.length}/${maxPerTeam}, Spec=${specPlayers.length}, Queue=${this.queue.length}, QueueActive=${this.isQueueActive}`);
        
        if (this.queue.length > 0) {
            const queueNames = this.queue.slice(0, 5).map(qp => `${qp.playerName}#${qp.playerId}(pos:${qp.queuePosition})`).join(', ');
            window.gameRoom.logger.i('QueueSystem-Debug', `Queue: ${queueNames}${this.queue.length > 5 ? '...' : ''}`);
        }
    }

    /**
     * Processes queue when there's space available in teams
     */
    public processQueue(): void {
        if (!this.isQueueActive) {
            window.gameRoom.logger.i('QueueSystem', 'ProcessQueue called but queue is not active');
            return;
        }

        const maxPlayersPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;
        const activePlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList()
            .filter((player: PlayerObject) => player.id !== 0 && 
                    window.gameRoom.playerList.has(player.id) && 
                    window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);

        const redCount = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Red).length;
        const blueCount = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Blue).length;
        const specCount = activePlayersList.filter((player: PlayerObject) => player.team === TeamID.Spec).length;

        // Calculate available spaces
        const redSpaces = Math.max(0, maxPlayersPerTeam - redCount);
        const blueSpaces = Math.max(0, maxPlayersPerTeam - blueCount);
        const totalSpaces = redSpaces + blueSpaces;

        window.gameRoom.logger.i('QueueSystem', `ProcessQueue: Red=${redCount}/${maxPlayersPerTeam}(spaces:${redSpaces}), Blue=${blueCount}/${maxPlayersPerTeam}(spaces:${blueSpaces}), Spec=${specCount}, Queue=${this.queue.length}`);

        if (totalSpaces > 0 && this.queue.length > 0) {
            const playersToAssign = Math.min(totalSpaces, this.queue.length);
            window.gameRoom.logger.i('QueueSystem', `Assigning ${playersToAssign} players from queue (available spaces: ${totalSpaces})`);
            
            for (let i = 0; i < playersToAssign; i++) {
                const nextPlayer = this.getNextPlayerFromQueue();
                if (nextPlayer) {
                    // Recalculate team counts each iteration to ensure accuracy
                    const currentActiveList = window.gameRoom._room.getPlayerList()
                        .filter((player: PlayerObject) => player.id !== 0 && 
                               window.gameRoom.playerList.has(player.id) && 
                               window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
                    
                    const currentRedCount = currentActiveList.filter((player: PlayerObject) => player.team === TeamID.Red).length;
                    const currentBlueCount = currentActiveList.filter((player: PlayerObject) => player.team === TeamID.Blue).length;
                    
                    // Subteam-aware team assignment logic
                    let targetTeam: TeamID | null = null;
                    
                    // Check if player has subteam members already in teams
                    let redSubteamMembers = 0;
                    let blueSubteamMembers = 0;
                    
                    try {
                        if (typeof (global as any).getPlayerSubteam === 'function') {
                            const subteam = (global as any).getPlayerSubteam(nextPlayer.name);
                            if (subteam) {
                                // Count subteam members in each team
                                for (const teamPlayer of currentActiveList) {
                                    if (teamPlayer.team === TeamID.Red || teamPlayer.team === TeamID.Blue) {
                                        for (const memberName of subteam.members) {
                                            if (this.normalizePlayerName(memberName) === this.normalizePlayerName(teamPlayer.name)) {
                                                if (teamPlayer.team === TeamID.Red) redSubteamMembers++;
                                                else if (teamPlayer.team === TeamID.Blue) blueSubteamMembers++;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        window.gameRoom.logger.w('QueueSystem', `Error checking subteam for ${nextPlayer.name}: ${e}`);
                    }
                    
                    // Assign to team with subteam members if possible, otherwise balance normally
                    if (currentRedCount < maxPlayersPerTeam && currentBlueCount < maxPlayersPerTeam) {
                        // Both teams have space - prefer team with more subteam members
                        if (redSubteamMembers > blueSubteamMembers) {
                            targetTeam = TeamID.Red;
                        } else if (blueSubteamMembers > redSubteamMembers) {
                            targetTeam = TeamID.Blue;
                        } else {
                            // No subteam preference, assign to team with fewer players
                            targetTeam = currentRedCount <= currentBlueCount ? TeamID.Red : TeamID.Blue;
                        }
                    } else if (currentRedCount < maxPlayersPerTeam) {
                        targetTeam = TeamID.Red;
                    } else if (currentBlueCount < maxPlayersPerTeam) {
                        targetTeam = TeamID.Blue;
                    }
                    
                    if (targetTeam !== null) {
                        window.gameRoom._room.setPlayerTeam(nextPlayer.id, targetTeam);
                        const subteamInfo = redSubteamMembers > 0 || blueSubteamMembers > 0 ? ` (subteam-aware: R:${redSubteamMembers}, B:${blueSubteamMembers})` : '';
                        window.gameRoom.logger.i('QueueSystem', `Player ${nextPlayer.name}#${nextPlayer.id} assigned from queue to ${targetTeam === TeamID.Red ? 'Red' : 'Blue'} team (Red:${currentRedCount}, Blue:${currentBlueCount})${subteamInfo}`);
                    } else {
                        // No space available, put player back in queue and stop processing
                        window.gameRoom.logger.w('QueueSystem', `No space available for player ${nextPlayer.name}#${nextPlayer.id}, keeping in queue`);
                        this.addPlayerToQueue(nextPlayer.id);
                        break;
                    }
                } else {
                    window.gameRoom.logger.w('QueueSystem', 'Could not get next player from queue');
                    break;
                }
            }
        } else {
            window.gameRoom.logger.i('QueueSystem', `No processing needed: totalSpaces=${totalSpaces}, queueSize=${this.queue.length}`);
        }

        // Check if queue should be deactivated
        if (!this.shouldQueueBeActive()) {
            window.gameRoom.logger.i('QueueSystem', 'Deactivating queue - no longer needed');
            this.deactivateQueue();
        }
    }
}
