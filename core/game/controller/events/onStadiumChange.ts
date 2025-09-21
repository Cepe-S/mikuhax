import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onStadiumChangeListner(newStadiumName: string, byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onStadiumChange', `Stadium changed to ${newStadiumName} by ${byPlayer ? byPlayer.name : 'system'}.`);
}