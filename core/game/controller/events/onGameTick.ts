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
                // Get all active players and check who has the ball
                const playerList = window.gameRoom._room.getPlayerList();
                let ballHolderFound = false;
                
                if (playerList && Array.isArray(playerList)) {
                    for (const player of playerList) {
                        if (player && player.id && player.id !== 0) {
                            const isHolding = window.gameRoom.ballStack.isPlayerHoldingBall(player.id);
                            if (isHolding) {
                                // Only one player should have powershot active at a time
                                if (!ballHolderFound) {
                                    window.gameRoom.ballStack.checkBallStuckToPlayer(player.id);
                                    ballHolderFound = true;
                                } else {
                                    // Multiple players detected with ball - reset to prevent conflicts
                                    window.gameRoom.ballStack.resetPowershot();
                                    window.gameRoom.logger.w('powershot', 'Multiple players detected with ball - powershot reset');
                                    break;
                                }
                            }
                        }
                    }
                    
                    // If no player is holding the ball, reset powershot
                    if (!ballHolderFound && window.gameRoom.ballStack.isPowershotActive()) {
                        window.gameRoom.ballStack.resetPowershot();
                    }
                }
            } catch (error) {
                window.gameRoom.logger.w('onGameTick', `Error in powershot detection: ${error}`);
            }
        }
    }
}