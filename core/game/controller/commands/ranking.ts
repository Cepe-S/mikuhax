import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { decideTier, getTierName, getTierColor } from "../../model/Statistics/Tier";

function formatTierNameWithColor(tier: any, playerId?: number): string {
    const tierName = getTierName(tier, playerId);
    const tierColor = getTierColor(tier);
    const colorHex = tierColor.toString(16).padStart(6, '0');
    return `<font color="#${colorHex}">${tierName}</font>`;
}

export function cmdRanking(byPlayer: PlayerObject): void {
    // Get all players who have completed placement matches
    const allPlayers = Array.from(window.gameRoom.playerList.values())
        .filter(p => p.stats.totals >= window.gameRoom.config.HElo.factor.placement_match_chances)
        .sort((a, b) => b.stats.rating - a.stats.rating);

    if (allPlayers.length === 0) {
        window.gameRoom._room.sendAnnouncement("❌ No hay jugadores con suficientes partidas para el ranking.", byPlayer.id, 0xFF0000, "normal", 1);
        return;
    }

    const top20 = allPlayers.slice(0, 20);
    let rankingMessage = "🏆 TOP 20 RANKING 🏆\n";
    
    top20.forEach((player, index) => {
        const rank = index + 1;
        const tier = decideTier(player.stats.rating, player.id);
        const tierName = formatTierNameWithColor(tier, player.id);
        const winRate = player.stats.totals > 0 ? Math.round((player.stats.wins / player.stats.totals) * 100) : 0;
        
        rankingMessage += `#${rank} ${tierName} ${player.name} - ${player.stats.rating} pts (${winRate}% WR)\n`;
    });

    // Show current player's position if not in top 20
    const currentPlayerIndex = allPlayers.findIndex(p => p.id === byPlayer.id);
    if (currentPlayerIndex >= 20) {
        const currentPlayer = allPlayers[currentPlayerIndex];
        const tier = decideTier(currentPlayer.stats.rating, currentPlayer.id);
        const tierName = formatTierNameWithColor(tier, currentPlayer.id);
        const winRate = currentPlayer.stats.totals > 0 ? Math.round((currentPlayer.stats.wins / currentPlayer.stats.totals) * 100) : 0;
        
        rankingMessage += `\n📍 Tu posición: #${currentPlayerIndex + 1} ${tierName} - ${currentPlayer.stats.rating} pts (${winRate}% WR)`;
    }

    window.gameRoom._room.sendAnnouncement(rankingMessage, byPlayer.id, 0xFFFFFF, "normal", 1);
}