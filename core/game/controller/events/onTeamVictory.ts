import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { ScoresObject } from "../../model/GameObject/ScoresObject";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { setRandomTeamColors, rotateStadium } from "../RoomTools";

export async function onTeamVictoryListener(scores: ScoresObject): Promise<void> {
    let placeholderVictory = {
        teamID: TeamID.Spec,
        teamName: '',
        redScore: scores.red,
        blueScore: scores.blue,
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count
    };

    let winnerTeamID: TeamID;
    let winningMessage: string = '';

    if (scores.red > scores.blue) {
        winnerTeamID = TeamID.Red;
        placeholderVictory.teamName = 'Red';
    } else {
        winnerTeamID = TeamID.Blue;
        placeholderVictory.teamName = 'Blue';
    }
    
    placeholderVictory.teamID = winnerTeamID;
    winningMessage = Tst.maketext(LangRes.onVictory.victory, placeholderVictory);

    window.gameRoom.isGamingNow = false;

    // Simple win streak tracking
    if (winnerTeamID !== window.gameRoom.winningStreak.teamID) {
        window.gameRoom.winningStreak.count = 1;
    } else {
        window.gameRoom.winningStreak.count++;
    }
    window.gameRoom.winningStreak.teamID = winnerTeamID;

    placeholderVictory.streakTeamName = convertTeamID2Name(window.gameRoom.winningStreak.teamID);
    placeholderVictory.streakTeamCount = window.gameRoom.winningStreak.count;

    if (window.gameRoom.winningStreak.count >= 3) {
        winningMessage += '\n' + Tst.maketext(LangRes.onVictory.burning, placeholderVictory);
    }

    // Update player statistics
    const allPlayers = window.gameRoom._room.getPlayerList();
    for (const player of allPlayers) {
        if (player.id === 0 || !window.gameRoom.playerList.has(player.id)) continue;
        
        const playerData = window.gameRoom.playerList.get(player.id)!;
        
        // Update totals for all players who participated
        if (player.team === TeamID.Red || player.team === TeamID.Blue) {
            playerData.stats.totals++;
            
            // Update wins for winning team
            if (player.team === winnerTeamID) {
                playerData.stats.wins++;
            }
            
            // Update goals and assists from match record
            playerData.stats.goals += playerData.matchRecord.goals || 0;
            playerData.stats.assists += playerData.matchRecord.assists || 0;
            playerData.stats.ogs += playerData.matchRecord.ogs || 0;
            playerData.stats.balltouch += playerData.matchRecord.balltouch || 0;
            playerData.stats.passed += playerData.matchRecord.passed || 0;
            
            // Simple rating calculation
            const winBonus = (player.team === winnerTeamID) ? 25 : -15;
            const goalBonus = (playerData.matchRecord.goals || 0) * 10;
            const assistBonus = (playerData.matchRecord.assists || 0) * 5;
            const ogPenalty = (playerData.matchRecord.ogs || 0) * -20;
            
            playerData.stats.rating += winBonus + goalBonus + assistBonus + ogPenalty;
            
            // Ensure rating doesn't go below 0
            if (playerData.stats.rating < 0) {
                playerData.stats.rating = 0;
            }
            
            // Save updated player data to database
            try {
                window._updatePlayerDB(window.gameRoom.config._RUID, {
                    auth: playerData.auth,
                    conn: playerData.conn,
                    name: playerData.name,
                    rating: playerData.stats.rating,
                    totals: playerData.stats.totals,
                    disconns: playerData.stats.disconns,
                    wins: playerData.stats.wins,
                    goals: playerData.stats.goals,
                    assists: playerData.stats.assists,
                    ogs: playerData.stats.ogs,
                    losePoints: playerData.stats.losePoints,
                    balltouch: playerData.stats.balltouch,
                    passed: playerData.stats.passed,
                    mute: playerData.permissions.mute,
                    muteExpire: playerData.permissions.muteExpire,
                    rejoinCount: playerData.entrytime.rejoinCount,
                    joinDate: playerData.entrytime.joinDate,
                    leftDate: playerData.entrytime.leftDate,
                    malActCount: playerData.permissions.malActCount
                }).catch(error => {
                    window.gameRoom.logger.w('onTeamVictory', `Failed to save player ${playerData.name} stats: ${error}`);
                });
            } catch (error) {
                window.gameRoom.logger.w('onTeamVictory', `Error updating player ${playerData.name} stats: ${error}`);
            }
            
            // Reset match record for next game
            playerData.matchRecord = {
                goals: 0,
                assists: 0,
                ogs: 0,
                losePoints: 0,
                balltouch: 0,
                passed: 0,
                factorK: 24
            };
        }
    }

    // Notify victory
    window.gameRoom.logger.i('onTeamVictory', `The game has ended. Scores ${scores.red}:${scores.blue}.`);
    window.gameRoom._room.sendAnnouncement(winningMessage, null, 0x00FF00, "bold", 1);

    // Auto-change teams and stadium after game ends
    setTimeout(() => {
        try {
            // Change teams every game
            setRandomTeamColors();
            
            // Rotate stadium every 2 games
            if (window.gameRoom.winningStreak.count % 2 === 0) {
                rotateStadium();
            }
        } catch (error) {
            window.gameRoom.logger.w('onTeamVictory', `Failed to auto-change teams/stadium: ${error}`);
        }
    }, 3000); // Wait 3 seconds after victory announcement
}