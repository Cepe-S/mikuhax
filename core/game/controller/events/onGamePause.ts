import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGamePauseListener(byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onGamePause', `Game paused by ${byPlayer ? byPlayer.name : 'system'}.`);
}