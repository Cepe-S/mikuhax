import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGameStartListener(byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onGameStart', `Game started by ${byPlayer ? byPlayer.name : 'system'}.`);
    window.gameRoom.isGamingNow = true;
}