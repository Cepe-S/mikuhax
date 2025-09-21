import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGameUnpauseListener(byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onGameUnpause', `Game unpaused by ${byPlayer ? byPlayer.name : 'system'}.`);
}