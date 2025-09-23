import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onPlayerBallKickListener(player: PlayerObject): void {
    // Update ball stack for powershot detection
    if (window.gameRoom.ballStack) {
        window.gameRoom.ballStack.push(player.id);
        window.gameRoom.ballStack.touchPlayerSubmit(player.id);
        window.gameRoom.ballStack.touchTeamSubmit(player.team);
        
        // Count possession for the team
        window.gameRoom.ballStack.possCount(player.team);
        
        // Update player match record
        if (window.gameRoom.playerList.has(player.id)) {
            const playerData = window.gameRoom.playerList.get(player.id)!;
            playerData.matchRecord.balltouch++;
        }
        
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