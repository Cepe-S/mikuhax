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

    // E(A)
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

    // Enhanced K*MoVM*(S-E) with win bonus guarantee
    public calcBothDiff(targetRecord: StatsRecord, counterpartRecord: StatsRecord, ratingWinnersMean: number, ratingLosersMean: number, factorK: number, playerTotals?: number): number {
        let baseDiff: number = 
            parseFloat((factorK 
            * this.calcMoVMultiplier(this.calcPD(targetRecord, counterpartRecord), this.calcQMultiplier(ratingWinnersMean, ratingLosersMean))
            * (this.calcResultDifference(targetRecord.realResult, targetRecord.rating, counterpartRecord.rating))
            ).toFixed(2));

        // Win bonus: Ensure winners always gain meaningful ELO for better distribution
        if (targetRecord.realResult === MatchResult.Win) {
            const minWinGain = Math.max(8, factorK * 0.15); // Minimum 8 points or 15% of K factor (more generous)
            if (baseDiff < minWinGain) {
                baseDiff = minWinGain;
            }
            
            // Additional bonus for lower-rated players beating higher-rated opponents
            if (targetRecord.rating < counterpartRecord.rating) {
                const ratingDifference = counterpartRecord.rating - targetRecord.rating;
                const upsetBonus = Math.min(ratingDifference * 0.1, factorK * 0.3); // Up to 30% of K factor bonus
                baseDiff += upsetBonus;
            }
        }
        // Loss protection: More generous protection to prevent rating deflation
        else if (targetRecord.realResult === MatchResult.Lose) {
            const maxLoss = -(factorK * 0.7); // Maximum loss is 70% of K factor (reduced from 80%)
            if (baseDiff < maxLoss) {
                baseDiff = maxLoss;
            }
            
            // Protection for higher-rated players losing to lower-rated opponents
            if (targetRecord.rating > counterpartRecord.rating) {
                const ratingDifference = targetRecord.rating - counterpartRecord.rating;
                const protectionFactor = Math.min(ratingDifference * 0.05, factorK * 0.2); // Up to 20% protection
                baseDiff = Math.max(baseDiff, -Math.abs(baseDiff) + protectionFactor);
            }
        }

        return parseFloat(baseDiff.toFixed(2));
    }

    // R' = R + sum of all diffs
    public calcNewRating(originalRating: number, diffs: number[]): number {
        let sumDiffs: number = diffs.reduce((acc, curr) => { return acc + curr}, 0);
        let res: number = Math.round(originalRating + sumDiffs);
        if(res < 0) res = 0; // minimum rating is 0.

        return res;
    }

    // R' = R + sum of all diffs + activity bonus (enhanced version for activity rewards)
    public calcNewRatingWithActivityBonus(originalRating: number, diffs: number[], playerTotals: number): number {
        let sumDiffs: number = diffs.reduce((acc, curr) => { return acc + curr}, 0);
        
        // Activity bonus: Reward players who play many games
        let activityBonus = 0;
        if (playerTotals > 0) {
            // Progressive bonus based on total games played
            if (playerTotals >= 500) {
                activityBonus = Math.max(sumDiffs * 0.15, 2); // 15% bonus for 500+ games, minimum 2 points
            } else if (playerTotals >= 200) {
                activityBonus = Math.max(sumDiffs * 0.10, 1.5); // 10% bonus for 200+ games
            } else if (playerTotals >= 100) {
                activityBonus = Math.max(sumDiffs * 0.05, 1); // 5% bonus for 100+ games
            } else if (playerTotals >= 50) {
                activityBonus = Math.max(sumDiffs * 0.02, 0.5); // 2% bonus for 50+ games
            }
            
            // Only apply bonus if gaining ELO
            if (sumDiffs > 0) {
                sumDiffs += activityBonus;
            }
        }
        
        let res: number = Math.round(originalRating + sumDiffs);
        if(res < 0) res = 0; // minimum rating is 0.

        return res;
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
