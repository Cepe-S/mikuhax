import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdDebugStadium(byPlayer: PlayerObject, fullMessage?: string): void {
    // Check admin permissions
    const playerData = window.gameRoom.playerList.get(byPlayer.id)!;
    const isAdmin = byPlayer.admin || playerData.permissions.superadmin;
    
    if (!isAdmin) {
        window.gameRoom._room.sendAnnouncement("Admin only command", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    if (!window.gameRoom.stadiumManager) {
        window.gameRoom._room.sendAnnouncement("❌ Stadium Manager not initialized", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    try {
        const debugStatus = window.gameRoom.stadiumManager.getDebugStatus();
        const activePlayers = Array.from(window.gameRoom.playerList.values()).filter(p => !p.permissions.afkmode).length;
        
        let debugMsg = `🏟️ STADIUM DEBUG STATUS:\n`;
        debugMsg += `Current Stadium: ${debugStatus.currentStadium}\n`;
        debugMsg += `Current State: ${debugStatus.currentState}\n`;
        debugMsg += `Active Players: ${activePlayers}/${debugStatus.minPlayers}\n`;
        debugMsg += `Ready Map: ${debugStatus.readyMap}\n`;
        debugMsg += `Game Map: ${debugStatus.gameMap}\n`;
        debugMsg += `Auto Operating: ${window.gameRoom.config.rules.autoOperating}\n`;
        
        window.gameRoom._room.sendAnnouncement(debugMsg, byPlayer.id, 0x00AA00, "small", 1);
        
        // Show recent actions
        if (debugStatus.recentActions && debugStatus.recentActions.length > 0) {
            let actionsMsg = `📋 RECENT STADIUM ACTIONS (last 5):\n`;
            debugStatus.recentActions.slice(0, 5).forEach((action: any, index: number) => {
                const time = new Date(action.timestamp).toLocaleTimeString();
                actionsMsg += `${index + 1}. [${time}] ${action.action}: ${action.stadiumName} (${action.state})\n`;
                actionsMsg += `   Players: ${action.playerCount}/${action.minPlayers} - ${action.reason}\n`;
            });
            
            window.gameRoom._room.sendAnnouncement(actionsMsg, byPlayer.id, 0xFFD700, "small", 0);
        }
        
    } catch (error) {
        window.gameRoom._room.sendAnnouncement(`❌ Debug error: ${error}`, byPlayer.id, 0xFF7777, "normal", 2);
        console.error('Stadium debug error:', error);
    }
}

// Register the command
registerCommand("debugstadium", cmdDebugStadium, {
    helpText: "🏟️ Shows stadium system debug information",
    category: "Admin Commands",
    adminOnly: true,
    requiresArgs: false
});