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
        const heloConfig = window.gameRoom.config.HElo;
        
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
    }

    // E(A) - Expected Result
    private calcExpectedResult(targetRating: number, counterpartRating: number): number {
        let res: number = parseFloat((1 / (1 + Math.pow(10, (counterpartRating - targetRating) / 400))).toFixed(2));
        return res;
    }

    // Q
    private calcQMultiplier(ratingWinnersMean: number, ratingLosersMean: number): number {
        let res: number = parseFloat((2.2 / ((ratingWinnersMean - ratingLosersMean) * 0.001 + 2.2)).toFixed(2));

        return res;
    }

    // PD
    private calcPD(targetRecord: StatsRecord, counterpartRecord: StatsRecord): number {
        let targetAdjustPassSuccRate: number = (targetRecord.realResult === MatchResult.Win)?targetRecord.matchPassSuccRate:(1-targetRecord.matchPassSuccRate);
        let counterpartAdjustPassSuccRate: number = (counterpartRecord.realResult === MatchResult.Win)?counterpartRecord.matchPassSuccRate:(1-counterpartRecord.matchPassSuccRate);
        
        let res: number = parseFloat((
            ((targetRecord.matchGoal - targetRecord.matchOG) * targetAdjustPassSuccRate)
            - ((counterpartRecord.matchGoal - counterpartRecord.matchOG) * counterpartAdjustPassSuccRate)
            ).toFixed(2));

        return res;
    }

    // MoVM
    private calcMoVMultiplier(difference: number, multiplierQ: number): number {
        let res: number = parseFloat((Math.log(Math.abs(difference) + 1) * multiplierQ).toFixed(2));

        return res;
    }

    // S(A)-E(A)
    private calcResultDifference(realResult: MatchResult, targetRating: number, counterpartRating: number): number {
        let res: number = parseFloat((realResult - this.calcExpectedResult(targetRating, counterpartRating)).toFixed(2));

        return res;
    }

    // Team-based ELO calculation (solves multiplicative problem)
    public calcTeamBasedElo(playerRating: number, opponentTeamAvg: number, result: MatchResult, playerGames: number, isTop1?: boolean, top1Rating?: number, teamSize?: number): number {
        const games = playerGames || 0;
        const isPlacement = games < (window.gameRoom.config.HElo.tier.placement_games || 10);
        
        // 1. Factor K with limited activity bonus
        const baseK = this.getKFactor(playerRating, games);
        const activityK = baseK * this.getActivityMultiplier(games);
        
        const expectedScore = this.calcExpectedResult(playerRating, opponentTeamAvg);
        const actualScore = result;
        
        let ratingChange = activityK * (actualScore - expectedScore);
        
        // 2. Multitudinal match scaling (reduce impact in large matches)
        if (teamSize && teamSize > 1) {
            const scaleFactor = teamSize === 2 ? 0.8 :
                               teamSize === 3 ? 0.7 :
                               teamSize >= 4 ? 0.6 : 1.0;
            ratingChange *= scaleFactor;
        }
        
        // 3. Progressive difficulty curve
        ratingChange *= this.getProgressionCurve(playerRating, isTop1 || false);
        
        // 4. TOP 1 mechanics
        if (isTop1) {
            ratingChange *= this.getTop1Protection(playerRating, opponentTeamAvg);
        } else if (top1Rating) {
            ratingChange *= this.getChallengerBonus(playerRating, top1Rating);
        }
        
        // 5. Elite protections (apply before limits)
        if (playerRating > 1400) {
            if (result === MatchResult.Win && ratingChange < 5) {
                ratingChange = Math.max(ratingChange, 5); // Minimum gain
            }
            if (result === MatchResult.Lose) {
                ratingChange = ratingChange * 0.5; // 50% loss reduction
            }
        }
        
        // 6. Match-wide ELO limits (not per opponent)
        const limits = this.getMatchLimits(games, isPlacement);
        ratingChange = Math.max(limits.min, Math.min(limits.max, ratingChange));
        
        return Math.round(ratingChange);
    }

    // Advanced motivational ELO system
    public calcBothDiff(targetRecord: StatsRecord, counterpartRecord: StatsRecord, ratingWinnersMean: number, ratingLosersMean: number, factorK: number, playerTotals?: number, isTop1?: boolean, top1Rating?: number): number {
        const games = playerTotals || 0;
        const isPlacement = games < (window.gameRoom.config.HElo.tier.placement_games || 10);
        
        // 1. Factor K with limited activity bonus
        const baseK = this.getKFactor(targetRecord.rating, games);
        const activityK = baseK * this.getActivityMultiplier(games);
        
        const expectedScore = this.calcExpectedResult(targetRecord.rating, counterpartRecord.rating);
        const actualScore = targetRecord.realResult;
        
        let ratingChange = activityK * (actualScore - expectedScore);
        
        // 2. Progressive difficulty curve
        ratingChange *= this.getProgressionCurve(targetRecord.rating, isTop1 || false);
        
        // 3. TOP 1 mechanics
        if (isTop1) {
            ratingChange *= this.getTop1Protection(targetRecord.rating, counterpartRecord.rating);
        } else if (top1Rating) {
            ratingChange *= this.getChallengerBonus(targetRecord.rating, top1Rating);
        }
        
        // 4. Dynamic ELO limits
        const limits = this.getEloLimits(games, isPlacement);
        ratingChange = Math.max(limits.min, Math.min(limits.max, ratingChange));
        
        // Small random variation to hide patterns
        const randomNoise = (Math.random() - 0.5) * 1.5;
        
        
        return Math.round(ratingChange + randomNoise);
    }
    
    private getActivityMultiplier(totalGames: number): number {
        const config = window.gameRoom.config.HElo.tier;
        const maxBonus = config.activity_max_bonus || 0.3;
        const saturationPoint = config.activity_saturation || 200;
        
        return 1 + (maxBonus * Math.min(totalGames / saturationPoint, 1));
    }
    
    private getProgressionCurve(currentRating: number, isTop1: boolean): number {
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
    
    private getEloLimits(totalGames: number, isPlacement: boolean): {min: number, max: number} {
        if (isPlacement) {
            return {min: -60, max: 60};
        }
        
        if (totalGames < 50) return {min: -40, max: 40};
        if (totalGames < 100) return {min: -35, max: 35};
        if (totalGames < 200) return {min: -30, max: 30};
        
        return {min: -25, max: 25};
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

    // R' = R + sum of all diffs with Chess.com bounds
    public calcNewRating(originalRating: number, diffs: number[]): number {
        let sumDiffs: number = diffs.reduce((acc, curr) => { return acc + curr}, 0);
        let res: number = Math.round(originalRating + sumDiffs);
        
        // Configurable rating bounds
        const MIN_RATING = 100;
        const MAX_RATING = window.gameRoom.config.HElo.tier.class_tier_9 || 3200;
        
        if(res < MIN_RATING) res = MIN_RATING;
        if(res > MAX_RATING) res = MAX_RATING;

        return res;
    }

    // Chess.com style rating with bounds (no activity bonus)
    public calcNewRatingWithActivityBonus(originalRating: number, diffs: number[], playerTotals: number): number {
        return this.calcNewRating(originalRating, diffs);
    }

    public calcTeamRatingsMean(eachTeamPlayers: PlayerObject[]): number {
        let res: number =  parseFloat((( eachTeamPlayers
            .map((eachPlayer: PlayerObject) => window.gameRoom.playerList.get(eachPlayer.id)!.stats.rating)
            .reduce((arr: number, curr: number) => { return arr+curr }, 0)
        ) / eachTeamPlayers.length).toFixed(2));

        return res;
    }

    public makeStasRecord(matchResult: MatchResult, teamPlayers: PlayerObject[]): StatsRecord[] {
        let statsRecords: StatsRecord[] = [];
        teamPlayers.forEach((eachPlayer: PlayerObject) => {
            statsRecords.push({
                rating: window.gameRoom.playerList.get(eachPlayer.id)!.stats.rating,
                realResult: matchResult,
                matchKFactor: window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.factorK,
                matchGoal: window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.goals,
                matchOG: window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.ogs,
                matchPassSuccRate: (
                    window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.balltouch === 0
                    ? 0
                    : parseFloat((window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.passed / window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.balltouch).toFixed(2))
                )
            });
        });

        return statsRecords;
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
