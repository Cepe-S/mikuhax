import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getUnixTimestamp } from "../Statistics";

export async function onPlayerLeaveListener(player: PlayerObject): Promise<void> {
    window.gameRoom.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);

    // Update player's left date if exists in playerList
    if (window.gameRoom.playerList.has(player.id)) {
        window.gameRoom.playerList.get(player.id)!.entrytime.leftDate = getUnixTimestamp();
        
        // Remove from playerList
        window.gameRoom.playerList.delete(player.id);
    }

    // Emit websocket event if function exists
    if (typeof window._emitSIOPlayerInOutEvent === 'function') {
        window._emitSIOPlayerInOutEvent(player.id);
    }
}