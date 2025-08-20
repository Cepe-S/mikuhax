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

    // Chess.com K-Factor system
    private getKFactor(rating: number, totalGames: number): number {
        if (totalGames < 30) return 40;  // Provisional period
        if (rating < 1200) return 32;   // Beginners
        if (rating < 1600) return 24;   // Intermediate
        if (rating < 2000) return 16;   // Advanced
        return 12;                      // Expert
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

    // Chess.com style ELO calculation
    public calcBothDiff(targetRecord: StatsRecord, counterpartRecord: StatsRecord, ratingWinnersMean: number, ratingLosersMean: number, factorK: number, playerTotals?: number): number {
        // Use Chess.com K-factor instead of passed factorK
        const chessComK = this.getKFactor(targetRecord.rating, playerTotals || 0);
        
        // Simple Chess.com formula: K * (S - E)
        const expectedScore = this.calcExpectedResult(targetRecord.rating, counterpartRecord.rating);
        const actualScore = targetRecord.realResult;
        
        let ratingChange = chessComK * (actualScore - expectedScore);
        
        return parseFloat(ratingChange.toFixed(2));
    }

    // R' = R + sum of all diffs with Chess.com bounds
    public calcNewRating(originalRating: number, diffs: number[]): number {
        let sumDiffs: number = diffs.reduce((acc, curr) => { return acc + curr}, 0);
        let res: number = Math.round(originalRating + sumDiffs);
        
        // Chess.com rating bounds
        const MIN_RATING = 100;
        const MAX_RATING = 3200;
        
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
