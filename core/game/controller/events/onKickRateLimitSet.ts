import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onKickRateLimitSetListener(min: number, rate: number, burst: number, byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onKickRateLimit', `Kick rate limit set: min=${min}, rate=${rate}, burst=${burst} by ${byPlayer ? byPlayer.name : 'system'}.`);
}