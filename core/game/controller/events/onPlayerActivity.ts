import { PlayerObject } from "../../model/GameObject/PlayerObject";

import { getUnixTimestamp } from "../Statistics";

export function onPlayerActivityListener(player : PlayerObject): void {
    // Event called when a player gives signs of activity, such as pressing a key.
    // This is useful for detecting inactive players.
    if(player != null && window.gameRoom.playerList.has(player.id) === true) {
        const playerData = window.gameRoom.playerList.get(player.id)!;
        const currentTime = getUnixTimestamp();
        const previousActivityTime = playerData.permissions.lastActivityTime;
        
        // Update last activity timestamp
        playerData.permissions.lastActivityTime = currentTime;
        
        // Reset AFK counter for backward compatibility
        playerData.afktrace.count = 0;
        
        // Log activity only if there was significant inactivity
        if (previousActivityTime && (currentTime - previousActivityTime) > 30000) {
            window.gameRoom.logger.i('onPlayerActivity', `Player ${player.name}#${player.id} showed activity after ${Math.floor((currentTime - previousActivityTime)/1000)}s`);
        }

        // reflect position in the field
        playerData.position = {
            x: player.position?.x || null
            ,y: player.position?.y || null
        }
    } else {
        window.gameRoom.logger.e('onPlayerActivity', `Error on onPlayerActivityListener: Cannot access player data. ${player.name}#${player.id}(team ${player.team}, conn ${player.conn}) is not registered in playerList.`)
    }
}
