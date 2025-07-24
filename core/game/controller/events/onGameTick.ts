// Counter for powershot checks (to avoid checking every single tick)
let powershotCheckCounter = 0;
const POWERSHOT_CHECK_INTERVAL = 3; // Check every 3 ticks (about every 200ms)

export function onGameTickListener(): void {
    // ==================== POWERSHOT CONTINUOUS DETECTION ====================
    // Only check if powershot is enabled and at intervals
    if (window.gameRoom && window.gameRoom.config && 
        window.gameRoom.config.settings && window.gameRoom.config.settings.powershotEnabled) {
        
        // Increment counter and check at intervals
        powershotCheckCounter++;
        
        if (powershotCheckCounter >= POWERSHOT_CHECK_INTERVAL) {
            powershotCheckCounter = 0; // Reset counter
            
            try {
                // Get all active players in the game
                const playerList = window.gameRoom._room.getPlayerList();
                
                if (playerList && Array.isArray(playerList)) {
                    // Check each active player to see if they have the ball stuck
                    for (const player of playerList) {
                        if (player && player.id && player.id !== 0) {
                            window.gameRoom.ballStack.checkBallStuckToPlayer(player.id);
                        }
                    }
                } else {
                    // Fallback to checking only the last touched player
                    const lastTouchedPlayerId = window.gameRoom.ballStack.getLastTouchPlayerID();
                    if (lastTouchedPlayerId && lastTouchedPlayerId !== 0) {
                        window.gameRoom.ballStack.checkBallStuckToPlayer(lastTouchedPlayerId);
                    }
                }
            } catch (error) {
                // Log error but don't announce to chat
                window.gameRoom.logger.w('onGameTick', `Error in powershot detection: ${error}`);
                // If there's any error, fallback to the old method
                const lastTouchedPlayerId = window.gameRoom.ballStack.getLastTouchPlayerID();
                if (lastTouchedPlayerId && lastTouchedPlayerId !== 0) {
                    window.gameRoom.ballStack.checkBallStuckToPlayer(lastTouchedPlayerId);
                }
            }
        }
    }
    // ==================== END POWERSHOT CONTINUOUS DETECTION ====================
}
