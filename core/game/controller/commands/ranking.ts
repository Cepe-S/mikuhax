import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { decideTier, getTierName, getTierColor, Tier } from "../../model/Statistics/Tier";

function getTierEmoji(tier: Tier): string {
    if(tier === Tier.TierNew) return '⚪'; // Placement
    if(tier === Tier.Tier1) return '🥉'; // Bronze
    if(tier === Tier.Tier2) return '🥈'; // Silver
    if(tier === Tier.Tier3) return '🥇'; // Gold
    if(tier === Tier.Tier4) return '💙'; // Platinum
    if(tier === Tier.Tier5) return '💚'; // Emerald
    if(tier === Tier.Tier6) return '💎'; // Diamond
    if(tier === Tier.Tier7) return '🏆'; // Master
    if(tier === Tier.Challenger) return '🚀'; // Challenger
    if(tier >= Tier.Tier8 && tier <= Tier.Tier27) return '🔥'; // Top Rankings
    return '❓'; // Unknown
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
        const tierEmoji = getTierEmoji(tier);
        const winRate = player.stats.totals > 0 ? Math.round((player.stats.wins / player.stats.totals) * 100) : 0;
        
        rankingMessage += `#${rank} ${tierEmoji} ${player.stats.rating} ➤ ${player.name} (${winRate}% WR)\n`;
    });

    // Show current player's position if not in top 20
    const currentPlayerIndex = allPlayers.findIndex(p => p.id === byPlayer.id);
    if (currentPlayerIndex >= 20) {
        const currentPlayer = allPlayers[currentPlayerIndex];
        const tier = decideTier(currentPlayer.stats.rating, currentPlayer.id);
        const tierEmoji = getTierEmoji(tier);
        const winRate = currentPlayer.stats.totals > 0 ? Math.round((currentPlayer.stats.wins / currentPlayer.stats.totals) * 100) : 0;
        
        rankingMessage += `\n📍 Tu posición: #${currentPlayerIndex + 1} ${tierEmoji} ${currentPlayer.stats.rating} ➤ ${currentPlayer.name} (${winRate}% WR)`;
    }

    window.gameRoom._room.sendAnnouncement(rankingMessage, byPlayer.id, 0xFFFFFF, "normal", 1);
}