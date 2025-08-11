import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { decideTier, getTierName, getTierColor, Tier, getDisplayElo, getTop20Cache } from "../../model/Statistics/Tier";
import { getAllPlayersFromDB } from "../Storage";
import { registerCommand } from "../CommandRegistry";

export async function cmdRanking(byPlayer: PlayerObject): Promise<void> {
    try {
        // First try to use the cached TOP 20 data
        const cachedTop20 = getTop20Cache();
        
        if (cachedTop20.length > 0) {
            // Use cached data - much faster!
            window.gameRoom.logger.i('cmdRanking', `Using cached TOP 20 data (${cachedTop20.length} players)`);
            
            let rankingMessage = "🏆 TOP 20 RANKING 🏆\n";
            rankingMessage += `👥 Datos del caché TOP 20 actualizado\n`;
            rankingMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            
            // Show cached top 20 players
            for (let i = 0; i < 20; i++) {
                const rank = i + 1;
                
                if (i < cachedTop20.length) {
                    const player = cachedTop20[i];
                    
                    // Use special formatting for top 3
                    let prefix = "";
                    if (rank === 1) prefix = "🥇 ";
                    else if (rank === 2) prefix = "🥈 ";
                    else if (rank === 3) prefix = "🥉 ";
                    
                    // Show real ELO from cache
                    rankingMessage += `${prefix}#${rank} 🏆${rank}°🏆 ${Math.round(player.rating)} ELO ➤ ${player.playerName}\n`;
                } else {
                    // Fill remaining slots with placeholders
                    rankingMessage += `#${rank} 🏆${rank}°🏆 [Posición Vacante]\n`;
                }
            }
            
            // Check current player's position in cached data
            const currentPlayerData = window.gameRoom.playerList.get(byPlayer.id);
            if (currentPlayerData) {
                const currentPlayerInTop20 = cachedTop20.find(p => p.playerAuth === currentPlayerData.auth);
                
                if (currentPlayerInTop20) {
                    rankingMessage += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
                    rankingMessage += `🎉 ¡Estás en el TOP 20! Posición #${currentPlayerInTop20.rank}`;
                } else {
                    // Player not in TOP 20, try to get their position from full database (fallback)
                    rankingMessage += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
                    const placementRemaining = window.gameRoom.config.HElo.factor.placement_match_chances - (currentPlayerData.stats.totals || 0);
                    if (placementRemaining > 0) {
                        rankingMessage += `⌈⚪⌋ Aún estás en partidas de colocación (${placementRemaining} restantes)`;
                    } else {
                        // Calculate how many ELO points needed to reach TOP 20
                        const currentPlayerElo = Math.round(currentPlayerData.stats.rating);
                        const top20MinElo = cachedTop20.length >= 20 ? Math.round(cachedTop20[19].rating) : 0;
                        
                        if (top20MinElo > 0 && currentPlayerElo < top20MinElo) {
                            const eloNeeded = top20MinElo - currentPlayerElo + 1; // +1 to surpass the #20
                            rankingMessage += `📍 Estas fuera del TOP 20 - ${currentPlayerElo} ELO (Te faltan ${eloNeeded} puntos para TOP 20)`;
                        } else {
                            rankingMessage += `📍 Estas fuera del TOP 20 - ${currentPlayerElo} ELO`;
                        }
                    }
                }
            }
            
            window.gameRoom._room.sendAnnouncement(rankingMessage, byPlayer.id, 0xFFD700, "normal", 1);
            return;
        }
        
        // Fallback: If cache is empty, query database directly (legacy behavior)
        window.gameRoom.logger.w('cmdRanking', 'TOP 20 cache is empty, falling back to direct database query');
        
        // Get all players from database who have completed placement matches
        const allPlayersFromDB = await getAllPlayersFromDB();
        const allPlayers = allPlayersFromDB
            .filter(p => p.totals >= window.gameRoom.config.HElo.factor.placement_match_chances)
            .sort((a, b) => b.rating - a.rating);

        if (allPlayers.length === 0) {
            window.gameRoom._room.sendAnnouncement("❌ No hay jugadores con suficientes partidas para el ranking.", byPlayer.id, 0xFF0000, "normal", 1);
            return;
        }

        // Always guarantee TOP 20 (fill with placeholders if needed)
        const top20 = allPlayers.slice(0, 20);
        const totalPlayers = allPlayers.length;
        
        let rankingMessage = "🏆 TOP 20 RANKING 🏆\n";
        rankingMessage += `👥 Total de jugadores calificados: ${totalPlayers}\n`;
        rankingMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        // Show actual top players
        for (let i = 0; i < 20; i++) {
            const rank = i + 1;
            
            if (i < top20.length) {
                const player = top20[i];
                const tier = decideTier(player.rating, 0);
                const tierName = getTierName(tier);
                const winRate = player.totals > 0 ? Math.round((player.wins / player.totals) * 100) : 0;
                
                // Use special formatting for top 3
                let prefix = "";
                if (rank === 1) prefix = "🥇 ";
                else if (rank === 2) prefix = "🥈 ";
                else if (rank === 3) prefix = "🥉 ";
                
                // Show real ELO for all players (TOP 20 format with real ELO)
                if (rank <= 20) {
                    rankingMessage += `${prefix}#${rank} 🏆${rank}°🏆 ${Math.round(player.rating)} ELO ➤ ${player.name} (${winRate}% WR)\n`;
                } else {
                    rankingMessage += `${prefix}#${rank} ${tierName} ${player.rating} ➤ ${player.name} (${winRate}% WR)\n`;
                }
            } else {
                // Fill remaining slots with placeholders to always show 20 positions
                rankingMessage += `#${rank} 🏆${rank}°🏆 [Posición Vacante]\n`;
            }
        }

        // Show current player's position if not in top 20
        const currentPlayerData = window.gameRoom.playerList.get(byPlayer.id);
        if (currentPlayerData) {
            const currentPlayerIndex = allPlayers.findIndex(p => p.auth === currentPlayerData.auth);
            if (currentPlayerIndex >= 20 && currentPlayerIndex !== -1) {
                const currentPlayer = allPlayers[currentPlayerIndex];
                const tier = decideTier(currentPlayer.rating, byPlayer.id);
                const tierName = getTierName(tier, byPlayer.id);
                const winRate = currentPlayer.totals > 0 ? Math.round((currentPlayer.wins / currentPlayer.totals) * 100) : 0;
                
                rankingMessage += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
                rankingMessage += `📍 Tu posición: #${currentPlayerIndex + 1} ${tierName} ${currentPlayer.rating} ➤ ${currentPlayer.name} (${winRate}% WR)`;
                
                if (currentPlayerIndex < 50) {
                    rankingMessage += "\n🔥 ¡Estás cerca del TOP 50!";
                } else if (currentPlayerIndex < 100) {
                    rankingMessage += "\n⭐ ¡Estás en el TOP 100!";
                }
            } else if (currentPlayerIndex >= 0 && currentPlayerIndex < 20) {
                rankingMessage += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
                rankingMessage += `🎉 ¡Estás en el TOP 20! Posición #${currentPlayerIndex + 1}`;
            } else {
                // Player not found in database, probably still in placement matches
                const placementRemaining = window.gameRoom.config.HElo.factor.placement_match_chances - (currentPlayerData.stats.totals || 0);
                if (placementRemaining > 0) {
                    rankingMessage += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
                    rankingMessage += `⌈⚪⌋ Aún estás en partidas de colocación (${placementRemaining} restantes)`;
                }
            }
        }

        window.gameRoom._room.sendAnnouncement(rankingMessage, byPlayer.id, 0xFFD700, "normal", 1);
    } catch (error) {
        window.gameRoom.logger.e('cmdRanking', `Error in ranking command: ${error}`);
        window.gameRoom._room.sendAnnouncement("❌ Error al obtener el ranking.", byPlayer.id, 0xFF0000, "normal", 1);
    }
}

// Register the command
registerCommand("ranking", cmdRanking, {
    helpText: "🏆 Muestra el ranking top 20 de jugadores por ELO",
    category: "Game Commands"
});