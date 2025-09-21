import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onPlayerAdminChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onPlayerAdminChange', `${changedPlayer.name} admin status changed by ${byPlayer ? byPlayer.name : 'system'}.`);
}