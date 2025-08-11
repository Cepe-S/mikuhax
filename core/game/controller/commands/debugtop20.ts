import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { debugTop20Cache, forceUpdateTop20Cache, isPlayerInTop20 } from "../../model/Statistics/Tier";
import { registerCommand } from "../CommandRegistry";

export async function cmdDebugTop20(byPlayer: PlayerObject): Promise<void> {
    try {
        // Get current player info
        const currentPlayer = window.gameRoom.playerList.get(byPlayer.id);
        if (!currentPlayer) {
            window.gameRoom._room.sendAnnouncement("❌ No se pudo obtener información del jugador.", byPlayer.id, 0xFF0000, "normal", 1);
            return;
        }

        // Check if player is in TOP 20 cache
        const top20Check = isPlayerInTop20(byPlayer.id);
        
        let debugMsg = "🔍 DEBUG TOP 20 CACHE\n";
        debugMsg += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        debugMsg += `👤 Tu Player ID: ${byPlayer.id}\n`;
        debugMsg += `� Tu Auth: ${currentPlayer.auth}\n`;
        debugMsg += `�📊 Tu ELO actual: ${currentPlayer.stats.rating}\n`;
        debugMsg += `🏆 En TOP 20 cache: ${top20Check.isTop20 ? `SÍ (Rank #${top20Check.rank})` : 'NO'}\n`;
        debugMsg += `💎 ELO cache: ${top20Check.realElo || 'N/A'}\n`;
        debugMsg += "\n📋 Cache info:\n";
        
        // Get cache debug info
        const cacheInfo = debugTop20Cache();
        debugMsg += cacheInfo.substring(0, 500) + (cacheInfo.length > 500 ? "..." : "");

        window.gameRoom._room.sendAnnouncement(debugMsg, byPlayer.id, 0x00FFFF, "normal", 1);
        
        // Force cache update for testing
        window.gameRoom._room.sendAnnouncement("🔄 Forzando actualización del caché...", byPlayer.id, 0xFFFF00, "normal", 1);
        forceUpdateTop20Cache();
        
        // Check again after update
        setTimeout(() => {
            const top20CheckAfter = isPlayerInTop20(byPlayer.id);
            let afterMsg = "🔄 DESPUÉS DE ACTUALIZACIÓN:\n";
            afterMsg += `🏆 En TOP 20 cache: ${top20CheckAfter.isTop20 ? `SÍ (Rank #${top20CheckAfter.rank})` : 'NO'}\n`;
            afterMsg += `💎 ELO cache: ${top20CheckAfter.realElo || 'N/A'}`;
            
            window.gameRoom._room.sendAnnouncement(afterMsg, byPlayer.id, 0x00FF00, "normal", 1);
        }, 1000);
        
    } catch (error) {
        window.gameRoom.logger.e('cmdDebugTop20', `Error in debug command: ${error}`);
        window.gameRoom._room.sendAnnouncement("❌ Error en comando debug.", byPlayer.id, 0xFF0000, "normal", 1);
    }
}

// Register the temporary debug command
registerCommand("debugtop20", cmdDebugTop20, {
    helpText: "🔍 Debug del sistema de caché TOP 20",
    category: "Admin Commands"
});
