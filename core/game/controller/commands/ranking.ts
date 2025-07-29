import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { decideTier, getTierName, getTierColor, Tier } from "../../model/Statistics/Tier";
import { getAllPlayersFromDB } from "../Storage";

export async function cmdRanking(byPlayer: PlayerObject): Promise<void> {
    try {
        // Get all players from database who have completed placement matches
        const allPlayersFromDB = await getAllPlayersFromDB();
        const allPlayers = allPlayersFromDB
            .filter(p => p.totals >= window.gameRoom.config.HElo.factor.placement_match_chances)
            .sort((a, b) => b.rating - a.rating);

        if (allPlayers.length === 0) {
            window.gameRoom._room.sendAnnouncement("❌ No hay jugadores con suficientes partidas para el ranking.", byPlayer.id, 0xFF0000, "normal", 1);
            return;
        }

        const top20 = allPlayers.slice(0, 20);
        let rankingMessage = "🏆 TOP 20 RANKING 🏆\n";
        
        top20.forEach((player, index) => {
            const rank = index + 1;
            const tier = decideTier(player.rating, 0);
            const tierName = getTierName(tier);
            const winRate = player.totals > 0 ? Math.round((player.wins / player.totals) * 100) : 0;
            
            rankingMessage += `#${rank} ${tierName} ${player.rating} ➤ ${player.name} (${winRate}% WR)\n`;
        });

        // Show current player's position if not in top 20
        const currentPlayerData = window.gameRoom.playerList.get(byPlayer.id);
        if (currentPlayerData) {
            const currentPlayerIndex = allPlayers.findIndex(p => p.auth === currentPlayerData.auth);
            if (currentPlayerIndex >= 20 && currentPlayerIndex !== -1) {
                const currentPlayer = allPlayers[currentPlayerIndex];
                const tier = decideTier(currentPlayer.rating, 0);
                const tierName = getTierName(tier);
                const winRate = currentPlayer.totals > 0 ? Math.round((currentPlayer.wins / currentPlayer.totals) * 100) : 0;
                
                rankingMessage += `\n📍 Tu posición: #${currentPlayerIndex + 1} ${tierName} ${currentPlayer.rating} ➤ ${currentPlayer.name} (${winRate}% WR)`;
            }
        }

        window.gameRoom._room.sendAnnouncement(rankingMessage, byPlayer.id, 0xFFD700, "normal", 1);
    } catch (error) {
        window.gameRoom._room.sendAnnouncement("❌ Error al obtener el ranking.", byPlayer.id, 0xFF0000, "normal", 1);
    }
}