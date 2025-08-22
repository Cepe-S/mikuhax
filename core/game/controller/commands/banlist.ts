import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdBanlist(byPlayer: PlayerObject, message?: string): void {
    if(window.gameRoom.playerList.get(byPlayer.id)!.admin == true || window.gameRoom.playerList.get(byPlayer.id)!.permissions.superadmin == true) {
        window.gameRoom._room.sendAnnouncement("🔍 Fetching ban list...", byPlayer.id, 0xFFFFFF, "normal", 1);
        
        try {
            window._getAllBansFromDB(window.gameRoom.config._RUID)
                .then(bans => {
                    if (!bans || !Array.isArray(bans) || bans.length === 0) {
                        window.gameRoom._room.sendAnnouncement("📋 No active bans found", byPlayer.id, 0x479947, "normal", 2);
                        return;
                    }
                    
                    const now = Date.now();
                    const activeBans = bans.filter((ban: any) => {
                        return ban && ban.auth && (ban.expire === -1 || ban.expire > now);
                    });
                    
                    if (activeBans.length === 0) {
                        window.gameRoom._room.sendAnnouncement("📋 No active bans found", byPlayer.id, 0x479947, "normal", 2);
                        return;
                    }
                    
                    window.gameRoom._room.sendAnnouncement(`📋 Lista de Bans Activos (${activeBans.length}):`, byPlayer.id, 0xFFFFFF, "bold", 2);
                    
                    activeBans.slice(0, 15).forEach((ban: any, index: number) => {
                        // Get player name from database or use 'Unknown' if not found
                        let playerName = 'Unknown';
                        
                        // Try to find the player name from current online players first
                        for (const [playerId, player] of window.gameRoom.playerList) {
                            if (player.auth === ban.auth) {
                                playerName = player.name;
                                break;
                            }
                        }
                        
                        // If not found online, use the name from ban record if available
                        if (playerName === 'Unknown' && ban.playerName) {
                            playerName = ban.playerName;
                        }
                        
                        const fullAuth = ban.auth || 'N/A';
                        
                        if (ban.expire === -1) {
                            // Permanent ban - don't show duration
                            window.gameRoom._room.sendAnnouncement(
                                `${index + 1}. ${playerName} | ${fullAuth} | Permanente`,
                                byPlayer.id,
                                0xFFAAAA,
                                "normal",
                                1
                            );
                        } else {
                            // Temporary ban - show duration
                            const expireText = `${Math.ceil((ban.expire - Date.now()) / (1000 * 60))}min`;
                            window.gameRoom._room.sendAnnouncement(
                                `${index + 1}. ${playerName} | ${fullAuth} | ${expireText}`,
                                byPlayer.id,
                                0xFFAAAA,
                                "normal",
                                1
                            );
                        }
                    });
                    
                    if (activeBans.length > 15) {
                        window.gameRoom._room.sendAnnouncement(
                            `... y ${activeBans.length - 15} bans más`,
                            byPlayer.id,
                            0xCCCCCC,
                            "normal",
                            1
                        );
                    }
                    
                    window.gameRoom._room.sendAnnouncement(
                        "💡 Usa !unban <auth_completo> para quitar un ban",
                        byPlayer.id,
                        0xFFFF88,
                        "normal",
                        2
                    );
                })
                .catch(error => {
                    window.gameRoom._room.sendAnnouncement("❌ Database connection error", byPlayer.id, 0xFF7777, "normal", 2);
                    window.gameRoom.logger.e('banlist', `Database error: ${error}`);
                });
        } catch (error) {
            window.gameRoom._room.sendAnnouncement("❌ Command execution error", byPlayer.id, 0xFF7777, "normal", 2);
            window.gameRoom.logger.e('banlist', `Command error: ${error}`);
        }
    } else {
        window.gameRoom._room.sendAnnouncement("❌ You don't have permission to use this command", byPlayer.id, 0xFF7777, "normal", 2);
    }
}

// Register the command
registerCommand("banlist", cmdBanlist, {
    helpText: "Show list of active bans with auth strings for unbanning",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});