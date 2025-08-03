import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function cmdDebugPowershot(byPlayer: PlayerObject, message?: string): void {
    // Show current powershot system status
    const ballStack = window.gameRoom.ballStack;
    
    const status = `
🔍 POWERSHOT DEBUG STATUS:
• Enabled: ${window.gameRoom.config.settings.powershotEnabled}
• Current Player: ${ballStack.getPowershotPlayer()}
• Counter: ${ballStack.getPowershotCounter()}
• Active: ${ballStack.isPowershotActive()}
• Last Touch: ${ballStack.getLastTouchPlayerID()}
• Threshold: ${window.gameRoom.config.settings.powershotActivationTime} deciseconds (${window.gameRoom.config.settings.powershotActivationTime * 0.1}s)
• Distance: ${window.gameRoom.config.settings.powershotStickDistance}
    `.trim();
    
    window.gameRoom._room.sendAnnouncement(status, byPlayer.id, 0x00FFFF, "normal", 1);
    
    // Also show if any player is currently holding the ball
    try {
        const playerList = window.gameRoom._room.getPlayerList();
        if (playerList && Array.isArray(playerList)) {
            for (const player of playerList) {
                if (player && player.id && player.id !== 0) {
                    const isHolding = ballStack.isPlayerHoldingBall(player.id);
                    if (isHolding) {
                        window.gameRoom._room.sendAnnouncement(
                            `🔥 Player #${player.id} (${player.name}) is holding the ball!`, 
                            byPlayer.id, 0x00FF00, "normal", 1
                        );
                    }
                }
            }
        }
    } catch (error) {
        window.gameRoom._room.sendAnnouncement(`❌ Error checking players: ${error}`, byPlayer.id, 0xFF0000, "normal", 1);
    }
}
