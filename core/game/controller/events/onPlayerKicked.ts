import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onPlayerKickedListener(kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name} was ${ban ? 'banned' : 'kicked'} by ${byPlayer ? byPlayer.name : 'system'}. Reason: ${reason}`);
}