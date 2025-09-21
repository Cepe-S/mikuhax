// Optimized powershot detection
let powershotCheckCounter = 0;
const POWERSHOT_CHECK_INTERVAL = 15; // Reduced frequency - check every 15 ticks (about every 900ms)

export function onGameTickListener(): void {
    // Only check if powershot is enabled
    if (window.gameRoom?.config?.settings?.powershotEnabled) {
        powershotCheckCounter++;
        
        if (powershotCheckCounter >= POWERSHOT_CHECK_INTERVAL) {
            powershotCheckCounter = 0;
            
            try {
                // Only check the last player who touched the ball (much more efficient)
                const lastTouchedPlayerId = window.gameRoom.ballStack.getLastTouchPlayerID();
                if (lastTouchedPlayerId && lastTouchedPlayerId !== 0) {
                    window.gameRoom.ballStack.checkBallStuckToPlayer(lastTouchedPlayerId);
                }
            } catch (error) {
                window.gameRoom.logger.w('onGameTick', `Error in powershot detection: ${error}`);
            }
        }
    }
}