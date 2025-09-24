import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onPlayerKickedListener(kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onPlayerKicked', `${kickedPlayer.name} was ${ban ? 'banned' : 'kicked'} by ${byPlayer ? byPlayer.name : 'system'}. Reason: ${reason}`);
    
    // Balance system integration - treat kick as player removal
    window.gameRoom.balanceManager.onPlayerRemoved(kickedPlayer.id);
}