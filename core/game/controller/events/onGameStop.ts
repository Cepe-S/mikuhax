import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGameStopListener(byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onGameStop', `Game stopped by ${byPlayer ? byPlayer.name : 'system'}.`);
    window.gameRoom.isGamingNow = false;
}