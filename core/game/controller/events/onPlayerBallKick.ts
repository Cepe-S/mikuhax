import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onPlayerBallKickListener(player: PlayerObject): void {
    // Update ball stack for powershot detection
    if (window.gameRoom.ballStack) {
        window.gameRoom.ballStack.push(player.id);
        window.gameRoom.ballStack.touchPlayerSubmit(player.id);
        
        // Check if powershot was applied
        if (window.gameRoom.ballStack.applyPowershotKick()) {
            // Powershot was applied, no additional action needed
        }
    }
    
    // Update player activity time
    if (window.gameRoom.playerList.has(player.id)) {
        window.gameRoom.playerList.get(player.id)!.permissions.lastActivityTime = Date.now() / 1000;
    }
}