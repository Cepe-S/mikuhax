import { PlayerObject } from "../GameObject/PlayerObject";
import { TeamID } from "../GameObject/TeamID";
import { getUnixTimestamp } from "../../controller/Statistics";

export interface EloViolation {
    playerId: number;
    type: 'AFK_ABUSE' | 'DISCONNECT';
    timestamp: number;
    matchTime: number;
    fromTeam?: TeamID;
    toTeam?: TeamID;
    penaltyApplied: number;
}

export class EloIntegrityTracker {
    private static instance: EloIntegrityTracker = new EloIntegrityTracker();
    private violations: Map<number, EloViolation[]> = new Map();
    private matchStartTime: number = 0;
    private playersAtMatchStart: Set<number> = new Set();
    private initialTeams: Map<number, TeamID> = new Map();

    private constructor() {}

    public static getInstance(): EloIntegrityTracker {
        if (!this.instance) {
            this.instance = new EloIntegrityTracker();
        }
        return this.instance;
    }

    public onMatchStart(): void {
        this.matchStartTime = getUnixTimestamp();
        this.violations.clear();
        this.playersAtMatchStart.clear();
        this.initialTeams.clear();
        
        // Record all players who started the match and their initial teams
        window.gameRoom._room.getPlayerList().forEach((player: PlayerObject) => {
            if (player.team !== TeamID.Spec && player.id !== 0) {
                this.playersAtMatchStart.add(player.id);
                this.initialTeams.set(player.id, player.team);
            }
        });
        
        window.gameRoom.logger.i('EloIntegrityTracker', `Match started - tracking ${this.playersAtMatchStart.size} players with initial teams`);
    }



    public onPlayerAFK(player: PlayerObject, isGoingAFK: boolean): boolean {
        // Skip if not in a match
        if (!window.gameRoom.isGamingNow || !window.gameRoom.isStatRecord || player.id === 0) {
            return false;
        }

        // Only penalize if going AFK during match from a team
        if (isGoingAFK && player.team !== TeamID.Spec) {
            const currentTime = window.gameRoom._room.getScores()?.time || 0;
            const minTimeForPenalty = 60; // 1 minute minimum play time before AFK penalty
            
            if (currentTime > minTimeForPenalty) {
                this.recordViolation(player.id, 'AFK_ABUSE', player.team, TeamID.Spec);
                return true;
            }
        }

        return false;
    }

    public onPlayerDisconnect(player: PlayerObject): boolean {
        // Skip if not in a match or if player wasn't part of match start
        if (!window.gameRoom.isGamingNow || !window.gameRoom.isStatRecord || player.id === 0) {
            return false;
        }

        // Only penalize if disconnecting from a team during match
        if (player.team !== TeamID.Spec) {
            const currentTime = window.gameRoom._room.getScores()?.time || 0;
            const minTimeForPenalty = 120; // 2 minutes minimum play time before disconnect penalty
            
            if (currentTime > minTimeForPenalty) {
                this.recordViolation(player.id, 'DISCONNECT', player.team, TeamID.Spec);
                return true;
            }
        }

        return false;
    }

    private recordViolation(playerId: number, type: EloViolation['type'], fromTeam?: TeamID, toTeam?: TeamID): void {
        const currentTime = window.gameRoom._room.getScores()?.time || 0;
        const penalty = this.calculatePenalty(type, playerId);
        
        const violation: EloViolation = {
            playerId,
            type,
            timestamp: getUnixTimestamp(),
            matchTime: currentTime,
            fromTeam,
            toTeam,
            penaltyApplied: penalty
        };

        if (!this.violations.has(playerId)) {
            this.violations.set(playerId, []);
        }
        this.violations.get(playerId)!.push(violation);

        // Apply penalty immediately
        if (window.gameRoom.playerList.has(playerId)) {
            const playerData = window.gameRoom.playerList.get(playerId)!;
            playerData.stats.rating = Math.max(100, playerData.stats.rating - penalty);
            
            window.gameRoom.logger.i('EloIntegrityTracker', 
                `Applied ${penalty} ELO penalty to ${playerData.name}#${playerId} for ${type}`);
            
            // Notify player
            const messages = {
                'AFK_ABUSE': `⚠️ Penalización: -${penalty} ELO por usar !afk durante partida`,
                'DISCONNECT': `⚠️ Penalización: -${penalty} ELO por desconexión durante partida`
            };
            
            window.gameRoom._room.sendAnnouncement(
                messages[type], 
                playerId, 
                0xFF6666, 
                "bold", 
                2
            );
        }
    }

    private calculatePenalty(type: EloViolation['type'], playerId: number): number {
        const baseRating = window.gameRoom.playerList.get(playerId)?.stats.rating || 1000;
        const violations = this.violations.get(playerId) || [];
        const repeatOffenses = violations.filter(v => v.type === type).length;
        
        let basePenalty: number;
        switch (type) {
            case 'AFK_ABUSE':
                basePenalty = 20;
                break;
            case 'DISCONNECT':
                basePenalty = 25;
                break;
            default:
                basePenalty = 10;
        }

        // Increase penalty for repeat offenses
        const repeatMultiplier = 1 + (repeatOffenses * 0.5);
        
        // Scale penalty based on rating (higher rated players lose more)
        const ratingMultiplier = Math.max(0.5, Math.min(2.0, baseRating / 1000));
        
        return Math.round(basePenalty * repeatMultiplier * ratingMultiplier);
    }

    public getInitialTeam(playerId: number): TeamID | undefined {
        return this.initialTeams.get(playerId);
    }

    public getPlayersAtMatchStart(): Set<number> {
        return new Set(this.playersAtMatchStart);
    }

    public clearViolations(): void {
        this.violations.clear();
        this.playersAtMatchStart.clear();
        this.initialTeams.clear();
    }
}