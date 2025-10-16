import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { PlayerUtils } from "./PlayerUtils";
import { decideTier, getTierName, getPlayerDisplayName } from "../../model/Statistics/Tier";
import * as StatCalc from "../Statistics";

export class StatsUtils {
    static isOnMatchNow(id: number): boolean {
        return window.gameRoom.isGamingNow && 
               window.gameRoom.isStatRecord && 
               window.gameRoom.playerList.get(id)?.team !== 0;
    }

    static getStatsPlaceholder(playerId: number) {
        const playerData = window.gameRoom.playerList.get(playerId);
        if (!playerData) return null;
        const player = window.gameRoom._room.getPlayerList().find(p => p.id === playerId);
        
        return {
            ticketTarget: playerId,
            targetName: getPlayerDisplayName(playerId, playerData.name, player?.admin || false, playerData.permissions.superadmin),
            targetAfkReason: playerData.permissions.afkreason,
            targetStatsRatingAvatar: getTierName(decideTier(playerData.stats.rating)),
            targetStatsRating: Math.round(playerData.stats.rating),
            targetStatsTotal: playerData.stats.totals,
            targetStatsDisconns: playerData.stats.disconns,
            targetStatsWins: playerData.stats.wins,
            targetStatsGoals: playerData.stats.goals,
            targetStatsAssists: playerData.stats.assists,
            targetStatsOgs: playerData.stats.ogs,
            targetStatsLosepoints: playerData.stats.losePoints,
            targetStatsWinRate: StatCalc.calcWinsRate(playerData.stats.totals, playerData.stats.wins),
            targetStatsPassSuccess: StatCalc.calcPassSuccessRate(playerData.stats.balltouch, playerData.stats.passed),
            targetStatsGoalsPerGame: StatCalc.calcGoalsPerGame(playerData.stats.totals, playerData.stats.goals),
            targetStatsAssistsPerGame: StatCalc.calcAssistsPerGame(playerData.stats.totals, playerData.stats.assists),
            targetStatsOgsPerGame: StatCalc.calcOGsPerGame(playerData.stats.totals, playerData.stats.ogs),
            targetStatsLostGoalsPerGame: StatCalc.calcLoseGoalsPerGame(playerData.stats.totals, playerData.stats.losePoints),
            targetStatsNowGoals: this.isOnMatchNow(playerId) ? playerData.matchRecord.goals : 0,
            targetStatsNowAssists: this.isOnMatchNow(playerId) ? playerData.matchRecord.assists : 0,
            targetStatsNowOgs: this.isOnMatchNow(playerId) ? playerData.matchRecord.ogs : 0,
            targetStatsNowPassSuccess: this.isOnMatchNow(playerId) ? 
                StatCalc.calcPassSuccessRate(playerData.matchRecord.balltouch, playerData.matchRecord.passed) : 0
        };
    }
}