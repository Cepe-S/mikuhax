import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";

export function onPlayerTeamChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onPlayerTeamChange', `${changedPlayer.name} moved to team ${changedPlayer.team} by ${byPlayer ? byPlayer.name : 'system'}.`);
    
    // Balance system integration
    window.gameRoom.balanceManager.onPlayerTeamChange(changedPlayer, changedPlayer.team as TeamID);
}