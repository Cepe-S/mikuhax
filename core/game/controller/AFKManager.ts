import { scheduler } from "../resource/strings";

export class AFKManager {
    private checkInterval: NodeJS.Timeout | null = null;
    private readonly CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

    public start(): void {
        if (this.checkInterval) return;
        
        this.checkInterval = setInterval(() => {
            this.checkAFKPlayers();
        }, this.CHECK_INTERVAL_MS);
    }

    public stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private checkAFKPlayers(): void {
        if (!window.gameRoom.config.settings.afkCommandAutoKick) return;

        const currentTime = Date.now();
        const maxAfkTime = window.gameRoom.config.settings.afkCommandAutoKickAllowMillisecs;

        for (const [playerId, playerData] of window.gameRoom.playerList) {
            // Skip admins and superadmins
            if (playerData.admin || playerData.permissions.superadmin) continue;
            
            // Check if player is AFK and has exceeded time limit
            if (playerData.permissions.afkmode && playerData.permissions.afkdate > 0) {
                const afkDuration = currentTime - playerData.permissions.afkdate;
                
                if (afkDuration >= maxAfkTime) {
                    // Log AFK kick for balance system awareness
                    window.gameRoom.logger.i('AFKManager', `Kicking AFK player ${playerData.name}#${playerId} after ${Math.floor(afkDuration / 60000)} minutes`);
                    
                    // Kick player for being AFK too long
                    // Note: This will trigger onPlayerLeave, but since player is AFK, balance won't be triggered
                    window.gameRoom._room.kickPlayer(playerId, scheduler.afkCommandTooLongKick, false);
                }
            }
        }
    }
}

// Global instance
export const afkManager = new AFKManager();