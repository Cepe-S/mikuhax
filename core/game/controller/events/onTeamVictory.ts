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