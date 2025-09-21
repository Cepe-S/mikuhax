import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onPlayerActivityListener(player: PlayerObject): void {
    // Update player activity time
    if (window.gameRoom.playerList.has(player.id)) {
        window.gameRoom.playerList.get(player.id)!.permissions.lastActivityTime = Date.now() / 1000;
    }
}