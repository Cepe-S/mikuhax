import { PlayerObject } from "../GameObject/PlayerObject";

export class HElo {
    // https://ryanmadden.net/posts/Adapting-Elo

    // written in Singleton Pattern
    // If the bot created HElo object once, never create ever until the bot instance dead. 

    private static instance: HElo = new HElo();

    private HElo() { } // not use
    
    public static getInstance(): HElo {
        if (this.instance == null) {
            this.instance = new HElo();
        }
        return this.instance;
    }

    // Configurable K-Factor system
    private getKFactor(rating: number, totalGames: number): number {
        try {
            const heloConfig = window.gameRoom?.config?.HElo;
            if (!heloConfig) {
                return window.gameRoom?.config?.HElo?.validation?.fallback_k_factor || 24;
            }
            
            if (heloConfig.useDefaultValues) {
                // Chess.com default values
                if (totalGames < 30) return 40;  // Provisional period
                if (rating < 1200) return 32;   // Beginners
                if (rating < 1600) return 24;   // Intermediate
                if (rating < 2000) return 16;   // Advanced
                return 12;                      // Expert
            }
            
            const config = heloConfig.factor;
            if (totalGames < config.placement_match_chances) return config.factor_k_placement;
            if (rating >= 2000) return config.factor_k_replace;
            return config.factor_k_normal;
        } catch (error) {
            window.gameRoom?.logger?.e('HElo', `Error in getKFactor: ${error}`);
            return 24; // Fallback seguro
        }
    }

    // E(A) - Expected Result (used by new system)
    private calcExpectedResult(targetRating: number, counterpartRating: number): number {
        return 1 / (1 + Math.pow(10, (counterpartRating - targetRating) / 400));
    }

    // Validation methods
    private validateGameState(): boolean {
        try {
            return !!(window.gameRoom?.config?.HElo?.guarantees && 
                     window.gameRoom?.playerList && 
                     typeof window.gameRoom.config.HElo.guarantees.min_win_elo === 'number');
        } catch (error) {
            return false;
        }
    }

    private calculateFallbackElo(result: MatchResult): number {
        const fallbackK = window.gameRoom?.config?.HElo?.validation?.fallback_k_factor || 24;
        return result === MatchResult.Win ? fallbackK * 0.5 : -fallbackK * 0.3;
    }

    private calculatePotentialWinChange(playerRating: number, opponentRating: number, playerGames: number, teamSize?: number): number {
        try {
            const heloConfig = window.gameRoom.config.HElo;
            const expectedScore = this.calcExpectedResult(playerRating, opponentRating);
            
            // Use same K-factor calculation as main method
            const baseK = this.getKFactor(playerRating, playerGames);
            let potentialChange = baseK * (1 - expectedScore);
            
            // Apply same modifiers as main calculation
            if (!heloConfig.useDefaultValues) {
                potentialChange *= this.getActivityMultiplier(playerGames);
                potentialChange *= this.getProgressionCurve(playerRating, false);
                
                // Team size scaling
                if (teamSize && teamSize > 1) {
                    const scaleFactor = teamSize === 2 ? 0.8 :
                                       teamSize === 3 ? 0.7 :
                                       teamSize >= 4 ? 0.6 : 1.0;
                    potentialChange *= scaleFactor;
                }
            } else if (teamSize && teamSize > 1) {
                const scaleFactor = teamSize === 2 ? 0.9 :
                                   teamSize === 3 ? 0.8 :
                                   teamSize >= 4 ? 0.7 : 1.0;
                potentialChange *= scaleFactor;
            }
            
            return potentialChange;
        } catch (error) {
            window.gameRoom?.logger?.e('HElo', `Error calculating potential win change: ${error}`);
            return 15; // Fallback conservador
        }
    }

    // Team-based ELO calculation (solves multiplicative problem)
    public calcTeamBasedElo(playerRating: number, opponentTeamAvg: number, result: MatchResult, playerGames: number, isTop1?: boolean, top1Rating?: number, teamSize?: number): number {
        // Validación de estado crítico
        if (!this.validateGameState()) {
            window.gameRoom?.logger?.w('HElo', 'Invalid game state detected, using fallback calculation');
            return this.calculateFallbackElo(result);
        }
        
        const games = playerGames || 0;
        const heloConfig = window.gameRoom.config.HElo;
        
        // Check if using Chess.com default values - if so, use pure ELO calculation
        if (heloConfig.useDefaultValues) {
            const baseK = this.getKFactor(playerRating, games);
            const expectedScore = this.calcExpectedResult(playerRating, opponentTeamAvg);
            const actualScore = result;
            
            let ratingChange = baseK * (actualScore - expectedScore);
            
            // Only apply team size scaling for Chess.com mode
            if (teamSize && teamSize > 1) {
                const scaleFactor = teamSize === 2 ? 0.9 :
                                   teamSize === 3 ? 0.8 :
                                   teamSize >= 4 ? 0.7 : 1.0;
                ratingChange *= scaleFactor;
            }
            
            return Math.round(ratingChange);
        }
        
        // Custom ELO system with all modifiers
        const isPlacement = games < (heloConfig.tier.placement_games || 10);
        
        // 1. Factor K with limited activity bonus
        const baseK = this.getKFactor(playerRating, games);
        const activityK = baseK * this.getActivityMultiplier(games);
        
        const expectedScore = this.calcExpectedResult(playerRating, opponentTeamAvg);
        const actualScore = result;
        
        let ratingChange = activityK * (actualScore - expectedScore);
        
        // 2. Simplified modifiers - only activity and progression
        ratingChange *= this.getActivityMultiplier(games);
        ratingChange *= this.getProgressionCurve(playerRating, isTop1 || false);
        
        // 3. Team size scaling
        if (teamSize && teamSize > 1) {
            const scaleFactor = teamSize === 2 ? 0.8 :
                               teamSize === 3 ? 0.7 :
                               teamSize >= 4 ? 0.6 : 1.0;
            ratingChange *= scaleFactor;
        }
        
        // 4. Apply minimum win guarantee first
        if (result === MatchResult.Win) {
            const minWinElo = heloConfig.guarantees?.min_win_elo || 10;
            if (ratingChange < minWinElo) {
                ratingChange = minWinElo;
            }
        }
        
        // 5. Elite protections for losses
        if (playerRating > 1400 && result === MatchResult.Lose) {
            ratingChange = ratingChange * 0.5; // 50% loss reduction
        }
        
        // 6. Apply ratio limiter after other modifiers
        ratingChange = this.applyRatioLimiter(ratingChange, result, playerRating, opponentTeamAvg, games, teamSize);
        
        // 7. Match-wide ELO limits (applied last)
        const limits = this.getMatchLimits(games, isPlacement);
        ratingChange = Math.max(limits.min, Math.min(limits.max, ratingChange));
        
        return Math.round(ratingChange);
    }


    
    private getActivityMultiplier(totalGames: number): number {
        // Skip activity multiplier if using Chess.com defaults
        if (window.gameRoom.config.HElo.useDefaultValues) {
            return 1.0;
        }
        
        const config = window.gameRoom.config.HElo.tier;
        const maxBonus = config.activity_max_bonus || 0.3;
        const saturationPoint = config.activity_saturation || 200;
        
        return 1 + (maxBonus * Math.min(totalGames / saturationPoint, 1));
    }
    
    private getProgressionCurve(currentRating: number, isTop1: boolean): number {
        // Skip progression curve if using Chess.com defaults
        if (window.gameRoom.config.HElo.useDefaultValues) {
            return 1.0;
        }
        
        if (isTop1) return 0.5;
        
        const config = window.gameRoom.config.HElo.tier;
        const easyZone = config.progression_easy_zone || 1200;
        const exponent = config.progression_exponent || 1.8;
        
        if (currentRating <= easyZone) return 1.1;
        
        const difficulty = Math.pow((currentRating - easyZone) / 400, exponent);
        return Math.max(0.6, 1.1 - difficulty);
    }

    
    private getTop1Protection(playerRating: number, opponentRating: number): number {
        const config = window.gameRoom.config.HElo.tier;
        const threshold = config.top1_protection_threshold || 200;
        
        const ratingDiff = playerRating - opponentRating;
        if (ratingDiff > threshold) {
            return 0.7;
        }
        return 1.0;
    }
    
    private getChallengerBonus(playerRating: number, top1Rating: number): number {
        const config = window.gameRoom.config.HElo.tier;
        const bonusZone = config.challenger_bonus_zone || 100;
        
        const diff = top1Rating - playerRating;
        
        if (diff > bonusZone) return 1.2;
        if (diff < 50) return 0.8;
        
        return 1.0;
    }
    


    // ELO ratio limiter - configurable loss:win ratio
    private applyRatioLimiter(ratingChange: number, result: MatchResult, playerRating: number, opponentRating: number, playerGames: number, teamSize?: number): number {
        if (result === MatchResult.Lose && Math.abs(ratingChange) > 0) {
            try {
                const maxRatio = window.gameRoom.config.HElo.guarantees?.max_loss_win_ratio || 0.6;
                const potentialWinChange = this.calculatePotentialWinChange(playerRating, opponentRating, playerGames, teamSize);
                const maxAllowedLoss = potentialWinChange * maxRatio;
                
                if (Math.abs(ratingChange) > maxAllowedLoss) {
                    ratingChange = -maxAllowedLoss;
                }
            } catch (error) {
                window.gameRoom?.logger?.e('HElo', `Error in ratio limiter: ${error}`);
                // Fallback: usar ratio 0.6 hardcoded
                const fallbackMaxLoss = Math.abs(ratingChange) * 0.6;
                ratingChange = -fallbackMaxLoss;
            }
        }
        return ratingChange;
    }

    // Match-wide limits (for team-based calculation)
    private getMatchLimits(totalGames: number, isPlacement: boolean): {min: number, max: number} {
        if (isPlacement) {
            return {min: -40, max: 40}; // Reduced from ±60
        }
        
        if (totalGames < 50) return {min: -30, max: 30}; // Reduced from ±40
        if (totalGames < 100) return {min: -25, max: 25}; // Reduced from ±35
        if (totalGames < 200) return {min: -20, max: 20}; // Reduced from ±30
        
        return {min: -18, max: 18}; // Reduced from ±25
    }



    public calcTeamRatingsMean(eachTeamPlayers: PlayerObject[]): number {
        let res: number =  parseFloat((( eachTeamPlayers
            .map((eachPlayer: PlayerObject) => window.gameRoom.playerList.get(eachPlayer.id)!.stats.rating)
            .reduce((arr: number, curr: number) => { return arr+curr }, 0)
        ) / eachTeamPlayers.length).toFixed(2));

        return res;
    }

    public makeStatsRecord(result: MatchResult, players: PlayerObject[]): StatsRecord[] {
        return players.map((player: PlayerObject) => ({
            rating: window.gameRoom.playerList.get(player.id)!.stats.rating,
            realResult: result,
            matchKFactor: window.gameRoom.playerList.get(player.id)!.matchRecord.factorK,
            matchGoal: window.gameRoom.playerList.get(player.id)!.matchRecord.goals,
            matchOG: window.gameRoom.playerList.get(player.id)!.matchRecord.ogs,
            matchPassSuccRate: (
                window.gameRoom.playerList.get(player.id)!.matchRecord.balltouch === 0
                ? 0
                : parseFloat((window.gameRoom.playerList.get(player.id)!.matchRecord.passed / window.gameRoom.playerList.get(player.id)!.matchRecord.balltouch).toFixed(2))
            )
        }));
    }


}

export interface StatsRecord {
    rating: number;
    realResult: MatchResult;
    matchKFactor: number;
    matchGoal: number;
    matchOG: number;
    matchPassSuccRate: number;
}

export enum MatchResult {
    Win = 1.0,
    Draw = 0.5,
    Lose = 0.0
}
