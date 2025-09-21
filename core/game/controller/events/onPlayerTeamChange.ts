import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onPlayerTeamChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onPlayerTeamChange', `${changedPlayer.name} moved to team ${changedPlayer.team} by ${byPlayer ? byPlayer.name : 'system'}.`);
}