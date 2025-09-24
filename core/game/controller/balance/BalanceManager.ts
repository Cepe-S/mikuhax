import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import { BalanceConfig, BalanceMode, DEFAULT_BALANCE_CONFIG } from "./BalanceConfig";
import { QueueSystem } from "./QueueSystem";
import { BalanceDebugger } from "./BalanceDebugger";
import { balance, teamName } from "../../resource/strings";

export class BalanceManager {
    private config: BalanceConfig = DEFAULT_BALANCE_CONFIG;
    private queueSystem = new QueueSystem();
    private debugger = new BalanceDebugger();
    private isProcessing = false;

    public setConfig(config: Partial<BalanceConfig>): void {
        this.config = { ...this.config, ...config };
        this.debugger.logAction(
            "CONFIG_CHANGE",
            0,
            "System",
            TeamID.Spec,
            TeamID.Spec,
            `Mode: ${this.config.mode}, MaxPerTeam: ${this.config.maxPlayersPerTeam}, Enabled: ${this.config.enabled}`,
            this.config.mode,
            this.getTeamCount(TeamID.Red),
            this.getTeamCount(TeamID.Blue)
        );
    }

    public getConfig(): BalanceConfig {
        return { ...this.config };
    }

    public onPlayerJoin(player: PlayerObject): void {
        if (!this.config.enabled || this.isProcessing) return;
        
        this.isProcessing = true;
        
        setTimeout(() => {
            try {
                const counts = this.getValidatedTeamCounts();
                
                if (this.config.mode === BalanceMode.JT) {
                    this.handleJTMode(player, counts.red, counts.blue);
                } else {
                    this.handlePROMode(player, counts.red, counts.blue);
                }
            } finally {
                this.isProcessing = false;
            }
        }, 50);
    }

    public onPlayerLeave(playerId: number): void {
        if (!this.config.enabled) return;

        const playerData = window.gameRoom.playerList.get(playerId);
        const playerName = playerData ? playerData.name : `Player#${playerId}`;
        const playerTeam = playerData ? playerData.team : TeamID.Spec;
        
        this.debugger.logAction(
            "PLAYER_LEAVE",
            playerId,
            playerName,
            playerTeam,
            TeamID.Spec,
            "Player disconnected",
            this.config.mode,
            this.getTeamCount(TeamID.Red),
            this.getTeamCount(TeamID.Blue),
            this.queueSystem.getQueueLength()
        );

        this.queueSystem.removeFromQueue(playerId);
        
        // Check for rebalancing after player leaves
        setTimeout(() => this.triggerRebalanceAfterLeave(), 100);
    }

    public onPlayerRemoved(playerId: number): void {
        // Handle any type of player removal (leave, kick, ban)
        this.onPlayerLeave(playerId);
    }
    
    public onPlayerAfkChange(player: PlayerObject, isGoingAfk: boolean): void {
        if (!this.config.enabled) return;
        
        const playerData = window.gameRoom.playerList.get(player.id);
        if (!playerData) return;
        
        if (isGoingAfk) {
            // Player going AFK - get team counts after they're moved to spec
            setTimeout(() => {
                const counts = this.getValidatedTeamCounts();
                
                this.debugger.logAction(
                    "PLAYER_AFK",
                    player.id,
                    player.name,
                    player.team, // This will be Spec now
                    TeamID.Spec,
                    `Player went AFK${playerData.permissions.afkreason ? ` (${playerData.permissions.afkreason})` : ''}`,
                    this.config.mode,
                    counts.red,
                    counts.blue,
                    this.queueSystem.getQueueLength()
                );
                
                // Remove from queue if in PRO mode
                if (this.config.mode === BalanceMode.PRO) {
                    this.queueSystem.removeFromQueue(player.id);
                }
                
                // Trigger rebalance after AFK
                this.triggerRebalanceAfterLeave();
            }, 50);
        } else {
            // Player returning from AFK - treat as joining
            this.debugger.logAction(
                "PLAYER_UNAFK",
                player.id,
                player.name,
                TeamID.Spec,
                TeamID.Spec,
                "Player returned from AFK",
                this.config.mode,
                this.getTeamCount(TeamID.Red),
                this.getTeamCount(TeamID.Blue),
                this.queueSystem.getQueueLength()
            );
            
            // Trigger balance as if they joined
            setTimeout(() => this.onPlayerJoin(player), 100);
        }
    }

    public forceRebalance(): void {
        if (this.config.mode === BalanceMode.PRO) {
            setTimeout(() => this.rebalanceFromQueue(), 50);
        } else if (this.config.mode === BalanceMode.JT) {
            setTimeout(() => this.forceJTBalance(), 50);
        }
    }

    public onPlayerTeamChange(player: PlayerObject, newTeam: TeamID): void {
        if (!this.config.enabled || this.isProcessing) return;

        setTimeout(() => {
            const counts = this.getValidatedTeamCounts();
            
            if (this.config.mode === BalanceMode.PRO && newTeam !== TeamID.Spec) {
                const wouldCreateImbalance = newTeam === TeamID.Red ? 
                    counts.red >= counts.blue + 1 : counts.blue >= counts.red + 1;
                    
                if (counts[newTeam === TeamID.Red ? 'red' : 'blue'] >= this.config.maxPlayersPerTeam || wouldCreateImbalance) {
                    window.gameRoom._room.setPlayerTeam(player.id, TeamID.Spec);
                    this.queueSystem.addToQueue(player);
                    
                    this.debugger.logAction(
                        "TEAM_CHANGE_BLOCKED",
                        player.id,
                        player.name,
                        newTeam,
                        TeamID.Spec,
                        "Team full or would create imbalance",
                        this.config.mode,
                        counts.red,
                        counts.blue,
                        this.queueSystem.getQueueLength()
                    );
                }
            }
        }, 50);
    }

    private handleJTMode(player: PlayerObject, redCount: number, blueCount: number): void {
        let targetTeam: TeamID;
        
        if (redCount < blueCount) {
            targetTeam = TeamID.Red;
        } else if (blueCount < redCount) {
            targetTeam = TeamID.Blue;
        } else {
            // Teams are equal, assign to random team if both have space
            if (redCount < this.config.maxPlayersPerTeam) {
                targetTeam = Math.random() < 0.5 ? TeamID.Red : TeamID.Blue;
            } else {
                return; // Both teams are full
            }
        }
        
        // Final validation before assignment
        const currentCounts = this.getValidatedTeamCounts();
        if (currentCounts[targetTeam === TeamID.Red ? 'red' : 'blue'] >= this.config.maxPlayersPerTeam) {
            return;
        }
        
        window.gameRoom._room.setPlayerTeam(player.id, targetTeam);
        
        this.debugger.logAction(
            "JT_ASSIGN",
            player.id,
            player.name,
            TeamID.Spec,
            targetTeam,
            `Assigned to ${targetTeam === TeamID.Red ? 'Red' : 'Blue'}`,
            this.config.mode,
            targetTeam === TeamID.Red ? currentCounts.red + 1 : currentCounts.red,
            targetTeam === TeamID.Blue ? currentCounts.blue + 1 : currentCounts.blue
        );
    }

    private handlePROMode(player: PlayerObject, redCount: number, blueCount: number): void {
        const totalPlayers = redCount + blueCount;
        const maxTotal = this.config.maxPlayersPerTeam * 2;
        const isBalanced = Math.abs(redCount - blueCount) <= 1;
        const hasSpace = totalPlayers < maxTotal;

        if (hasSpace && isBalanced && redCount < this.config.maxPlayersPerTeam && blueCount < this.config.maxPlayersPerTeam) {
            const targetTeam = redCount <= blueCount ? TeamID.Red : TeamID.Blue;
            
            // Final validation
            const currentCounts = this.getValidatedTeamCounts();
            if (currentCounts[targetTeam === TeamID.Red ? 'red' : 'blue'] < this.config.maxPlayersPerTeam) {
                window.gameRoom._room.setPlayerTeam(player.id, targetTeam);
                
                this.debugger.logAction(
                    "PRO_ASSIGN",
                    player.id,
                    player.name,
                    TeamID.Spec,
                    targetTeam,
                    "Direct assignment (balanced)",
                    this.config.mode,
                    targetTeam === TeamID.Red ? currentCounts.red + 1 : currentCounts.red,
                    targetTeam === TeamID.Blue ? currentCounts.blue + 1 : currentCounts.blue
                );
                return;
            }
        }
        
        this.queueSystem.addToQueue(player);
        
        this.debugger.logAction(
            "PRO_QUEUE",
            player.id,
            player.name,
            TeamID.Spec,
            TeamID.Spec,
            "Added to queue",
            this.config.mode,
            redCount,
            blueCount,
            this.queueSystem.getQueueLength()
        );
    }

    private rebalanceFromQueue(): void {
        if (this.config.mode !== BalanceMode.PRO || this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            const counts = this.getValidatedTeamCounts();
            const isBalanced = Math.abs(counts.red - counts.blue) <= 1;
            const hasSpace = counts.red < this.config.maxPlayersPerTeam || counts.blue < this.config.maxPlayersPerTeam;
            const queueLength = this.queueSystem.getQueueLength();
            
            this.debugger.logAction(
                "PRO_REBALANCE_CHECK",
                0,
                "System",
                TeamID.Spec,
                TeamID.Spec,
                `Checking rebalance: R:${counts.red} B:${counts.blue}, Balanced: ${isBalanced}, HasSpace: ${hasSpace}, Queue: ${queueLength}`,
                this.config.mode,
                counts.red,
                counts.blue,
                queueLength
            );
            
            if (isBalanced && hasSpace && queueLength > 0) {
                const nextPlayer = this.queueSystem.popNextPlayer();
                if (nextPlayer && window.gameRoom.playerList.has(nextPlayer.playerId)) {
                    const targetTeam = counts.red <= counts.blue ? TeamID.Red : TeamID.Blue;
                    
                    if (counts[targetTeam === TeamID.Red ? 'red' : 'blue'] < this.config.maxPlayersPerTeam) {
                        window.gameRoom._room.setPlayerTeam(nextPlayer.playerId, targetTeam);
                        
                        // Send balance message to chat
                        const teamNameStr = targetTeam === TeamID.Red ? teamName.redTeam : teamName.blueTeam;
                        const balanceMsg = balance.proRebalance
                            .replace('{playerName}', nextPlayer.playerName)
                            .replace('{playerID}', nextPlayer.playerId.toString())
                            .replace('{teamName}', teamNameStr);
                        window.gameRoom._room.sendAnnouncement(balanceMsg, null, 0x5DADE2, "normal", 1);
                        
                        this.debugger.logAction(
                            "PRO_REBALANCE",
                            nextPlayer.playerId,
                            nextPlayer.playerName,
                            TeamID.Spec,
                            targetTeam,
                            "Moved from queue",
                            this.config.mode,
                            targetTeam === TeamID.Red ? counts.red + 1 : counts.red,
                            targetTeam === TeamID.Blue ? counts.blue + 1 : counts.blue,
                            this.queueSystem.getQueueLength()
                        );
                    } else {
                        // Put player back in queue if team became full
                        const playerObj = window.gameRoom.playerList.get(nextPlayer.playerId);
                        if (playerObj) {
                            this.queueSystem.addToQueue(playerObj);
                        }
                        
                        this.debugger.logAction(
                            "PRO_REBALANCE_FAILED",
                            nextPlayer.playerId,
                            nextPlayer.playerName,
                            TeamID.Spec,
                            TeamID.Spec,
                            "Target team became full, returned to queue",
                            this.config.mode,
                            counts.red,
                            counts.blue,
                            this.queueSystem.getQueueLength()
                        );
                    }
                } else if (nextPlayer) {
                    this.debugger.logAction(
                        "PRO_REBALANCE_FAILED",
                        nextPlayer.playerId,
                        nextPlayer.playerName,
                        TeamID.Spec,
                        TeamID.Spec,
                        "Player no longer in game",
                        this.config.mode,
                        counts.red,
                        counts.blue,
                        queueLength
                    );
                }
            } else {
                let reason = "";
                if (!isBalanced) reason += "Teams unbalanced ";
                if (!hasSpace) reason += "No space available ";
                if (queueLength === 0) reason += "Queue empty";
                
                this.debugger.logAction(
                    "PRO_REBALANCE_SKIPPED",
                    0,
                    "System",
                    TeamID.Spec,
                    TeamID.Spec,
                    reason.trim() || "Unknown reason",
                    this.config.mode,
                    counts.red,
                    counts.blue,
                    queueLength
                );
            }
        } finally {
            this.isProcessing = false;
        }
    }

    private getTeamCount(team: TeamID): number {
        return Array.from(window.gameRoom.playerList.values())
            .filter(p => p.team === team).length;
    }

    private getValidatedTeamCounts(): { red: number; blue: number } {
        // Always use native Haxball method first as it's more reliable for current game state
        try {
            const playerList = window.gameRoom._room.getPlayerList();
            if (playerList && Array.isArray(playerList)) {
                const nativeRed = playerList.filter(p => p.team === TeamID.Red).length;
                const nativeBlue = playerList.filter(p => p.team === TeamID.Blue).length;
                return { red: nativeRed, blue: nativeBlue };
            }
        } catch (e) {
            // Fallback to our method if native fails
        }
        
        // Fallback to our internal tracking
        const ourRed = this.getTeamCount(TeamID.Red);
        const ourBlue = this.getTeamCount(TeamID.Blue);
        
        return { red: ourRed, blue: ourBlue };
    }

    private isTeamFull(team: TeamID): boolean {
        return this.getTeamCount(team) >= this.config.maxPlayersPerTeam;
    }



    public getQueueSystem(): QueueSystem {
        return this.queueSystem;
    }

    public getDebugger(): BalanceDebugger {
        return this.debugger;
    }

    private forceJTBalance(): void {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            const counts = this.getValidatedTeamCounts();
            const difference = Math.abs(counts.red - counts.blue);
            
            this.debugger.logAction(
                "JT_BALANCE_CHECK",
                0,
                "System",
                TeamID.Spec,
                TeamID.Spec,
                `Checking balance: R:${counts.red} B:${counts.blue} (diff: ${difference})`,
                this.config.mode,
                counts.red,
                counts.blue
            );
            
            // If teams are unbalanced by more than 1 player
            if (difference > 1) {
                const biggerTeam = counts.red > counts.blue ? TeamID.Red : TeamID.Blue;
                const smallerTeam = counts.red > counts.blue ? TeamID.Blue : TeamID.Red;
                
                // Use native Haxball method to get current players in bigger team
                let playersInBiggerTeam: any[] = [];
                try {
                    const nativePlayerList = window.gameRoom._room.getPlayerList();
                    if (nativePlayerList && Array.isArray(nativePlayerList)) {
                        playersInBiggerTeam = nativePlayerList.filter(p => p.team === biggerTeam);
                    }
                } catch (e) {
                    // Fallback to our internal tracking
                    playersInBiggerTeam = Array.from(window.gameRoom.playerList.values())
                        .filter(p => p.team === biggerTeam);
                }
                
                if (playersInBiggerTeam.length > 0) {
                    // Move the last player from the bigger team to the smaller team
                    const playerToMove = playersInBiggerTeam[playersInBiggerTeam.length - 1];
                    window.gameRoom._room.setPlayerTeam(playerToMove.id, smallerTeam);
                    
                    // Send balance message to chat
                    const teamNameStr = smallerTeam === TeamID.Red ? teamName.redTeam : teamName.blueTeam;
                    const balanceMsg = balance.jtRebalance
                        .replace('{playerName}', playerToMove.name || `Player`)
                        .replace('{playerID}', playerToMove.id.toString())
                        .replace('{teamName}', teamNameStr);
                    window.gameRoom._room.sendAnnouncement(balanceMsg, null, 0x5DADE2, "normal", 1);
                    
                    this.debugger.logAction(
                        "JT_REBALANCE",
                        playerToMove.id,
                        playerToMove.name || `Player#${playerToMove.id}`,
                        biggerTeam,
                        smallerTeam,
                        `Moved to balance teams (${counts.red}v${counts.blue})`,
                        this.config.mode,
                        biggerTeam === TeamID.Red ? counts.red - 1 : counts.red + 1,
                        smallerTeam === TeamID.Blue ? counts.blue + 1 : counts.blue - 1
                    );
                } else {
                    this.debugger.logAction(
                        "JT_BALANCE_FAILED",
                        0,
                        "System",
                        TeamID.Spec,
                        TeamID.Spec,
                        `No players found in bigger team (${biggerTeam === TeamID.Red ? 'Red' : 'Blue'})`,
                        this.config.mode,
                        counts.red,
                        counts.blue
                    );
                }
            } else {
                this.debugger.logAction(
                    "JT_BALANCE_OK",
                    0,
                    "System",
                    TeamID.Spec,
                    TeamID.Spec,
                    "Teams are already balanced",
                    this.config.mode,
                    counts.red,
                    counts.blue
                );
            }
        } finally {
            this.isProcessing = false;
        }
    }

    private triggerRebalanceAfterLeave(): void {
        if (this.config.mode === BalanceMode.PRO) {
            this.rebalanceFromQueue();
        } else if (this.config.mode === BalanceMode.JT) {
            const counts = this.getValidatedTeamCounts();
            if (Math.abs(counts.red - counts.blue) > 1) {
                this.forceJTBalance();
            }
        }
    }

    public getStatus() {
        const counts = this.getValidatedTeamCounts();
        return {
            config: this.config,
            redCount: counts.red,
            blueCount: counts.blue,
            queueLength: this.queueSystem.getQueueLength(),
            queue: this.queueSystem.getQueue(),
            recentActions: this.debugger.getRecentActions(20),
            isProcessing: this.isProcessing
        };
    }
}