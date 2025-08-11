export function decideTier(rating: number, playerId?: number): Tier {
    // Check if player is in placement matches
    if (playerId && isInPlacementMatches(playerId)) {
        return Tier.TierNew;
    }

    // Check for TOP rankings first (overrides rating-based tiers)
    if (playerId) {
        const playerRank = getPlayerRankSync(playerId);
        if (playerRank <= 20) {
            return (Tier.Tier8 + (playerRank - 1)) as Tier; // Top 1-20
        }
    }

    // Standard tier system with improved ranges based on analysis
    if(rating < window.gameRoom.config.HElo.tier.class_tier_1) return Tier.Tier1; // Bronze < 600
    if(rating < window.gameRoom.config.HElo.tier.class_tier_2) return Tier.Tier2; // Silver < 800  
    if(rating < window.gameRoom.config.HElo.tier.class_tier_3) return Tier.Tier3; // Gold < 1000
    if(rating < window.gameRoom.config.HElo.tier.class_tier_4) return Tier.Tier4; // Platinum < 1200
    if(rating < window.gameRoom.config.HElo.tier.class_tier_5) return Tier.Tier5; // Emerald < 1400
    if(rating < window.gameRoom.config.HElo.tier.class_tier_6) return Tier.Tier6; // Diamond < 1600
    if(rating < window.gameRoom.config.HElo.tier.class_tier_7) return Tier.Tier7; // Master < 1800
    
    return Tier.Challenger; // Above Master but not in Top 20
}

function isInPlacementMatches(playerId: number): boolean {
    const player = window.gameRoom.playerList.get(playerId);
    if (!player) return false;
    return player.stats.totals < window.gameRoom.config.HElo.factor.placement_match_chances;
}

// Synchronous version for immediate use (uses cached data)
function getPlayerRankSync(playerId: number): number {
    try {
        const sessionPlayer = window.gameRoom.playerList.get(playerId);
        if (sessionPlayer) {
            const playerTotals = sessionPlayer.stats.totals;
            
            // If player hasn't finished placement matches, they don't have a rank yet
            if (playerTotals < window.gameRoom.config.HElo.factor.placement_match_chances) {
                return 999; // No rank during placement
            }
            
            // Use session data for immediate ranking - get ALL players from memory for better ranking
            const allPlayers = Array.from(window.gameRoom.playerList.values())
                .filter(p => p.stats.totals >= window.gameRoom.config.HElo.factor.placement_match_chances)
                .sort((a, b) => b.stats.rating - a.stats.rating);
            
            const playerIndex = allPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                return playerIndex + 1;
            }
        }
    } catch (error) {
        window.gameRoom.logger.e('getPlayerRankSync', `Error getting player rank: ${error}`);
    }
    
    return 999;
}

// Calculate ELO for TOP 20 players based on their global position
export function getTopPlayerElo(rank: number): number {
    if (rank > 20) return 0; // Not a top player
    
    // Use tier config with fallback values for TOP ELOs
    const config = window.gameRoom.config.HElo.tier as any;
    const topBaseElo = config.top_20_base_elo || 2200;
    const top10BaseElo = config.top_10_base_elo || 2400;
    const top1BaseElo = config.top_1_base_elo || 2600;
    
    if (rank === 1) {
        return top1BaseElo; // T1: 2600 ELO
    } else if (rank <= 10) {
        // T10-T2: 2400-2590 ELO (scale from 2400 to 2590)
        const eloIncrement = (top1BaseElo - top10BaseElo) / 9;
        return Math.round(top10BaseElo + (10 - rank) * eloIncrement);
    } else {
        // T20-T11: 2200-2390 ELO (scale from 2200 to 2390)
        const eloIncrement = (top10BaseElo - topBaseElo) / 10;
        return Math.round(topBaseElo + (20 - rank) * eloIncrement);
    }
}

// Get display ELO for a player (shows TOP ELO if in top 20)
export function getDisplayElo(playerId: number, actualElo: number): number {
    const rank = getPlayerRankSync(playerId);
    if (rank <= 20) {
        return getTopPlayerElo(rank);
    }
    return actualElo;
}

export function getAvatarByTier(tier: Tier, playerId?: number): string {
    if(tier === Tier.TierNew) return window.gameRoom.config.HElo.avatar.avatar_tier_new;
    if(tier === Tier.Tier1) return window.gameRoom.config.HElo.avatar.avatar_tier_1; // Bronze
    if(tier === Tier.Tier2) return window.gameRoom.config.HElo.avatar.avatar_tier_2; // Silver
    if(tier === Tier.Tier3) return window.gameRoom.config.HElo.avatar.avatar_tier_3; // Gold
    if(tier === Tier.Tier4) return window.gameRoom.config.HElo.avatar.avatar_tier_4; // Platinum
    if(tier === Tier.Tier5) return window.gameRoom.config.HElo.avatar.avatar_tier_5; // Emerald
    if(tier === Tier.Tier6) return window.gameRoom.config.HElo.avatar.avatar_tier_6; // Diamond
    if(tier === Tier.Tier7) return window.gameRoom.config.HElo.avatar.avatar_tier_7; // Master
    if(tier === Tier.Challenger) return window.gameRoom.config.HElo.avatar.avatar_challenger;
    
    // Top 20 players get special rank indicators with format 🏆1°🏆 (ELO)
    if(tier >= Tier.Tier8 && tier <= Tier.Tier27 && playerId) {
        const rank = getPlayerRankSync(playerId);
        const topElo = getTopPlayerElo(rank);
        return `🏆${rank}°🏆 (${topElo})`;
    }
    
    return window.gameRoom.config.HElo.avatar.avatar_unknown;
}

export function getTierName(tier: Tier, playerId?: number): string {
    if (tier === Tier.TierNew)      return "⌈⚪⌋ Placement";
    if (tier === Tier.Tier1)        return "⌈🟤⌋ Bronce";
    if (tier === Tier.Tier2)        return "⌈⚪⌋ Plata";
    if (tier === Tier.Tier3)        return "⌈🟡⌋ Oro";
    if (tier === Tier.Tier4)        return "【⌈🟦⌋】 Platino";
    if (tier === Tier.Tier5)        return "【⌈🟩⌋】 Esmeralda";
    if (tier === Tier.Tier6)        return "【⌈✨💎✨⌋】 Diamante";
    if (tier === Tier.Tier7)        return "【⌈✨👑✨⌋】 Maestro";
    if (tier === Tier.Challenger)   return "【⌈✨🚀✨⌋】 Challenger";

    if (tier >= Tier.Tier8 && tier <= Tier.Tier27 && playerId) {
        const rank = getPlayerRankSync(playerId);
        const topElo = getTopPlayerElo(rank);
        
        // Format: 🏆1°🏆 with ELO for TOP rankings
        return `🏆${rank}°🏆 (${topElo} ELO)`;
    }

    return "[UNKNOWN]";
}

export function getTierColor(tier: Tier): number {
    if(tier === Tier.TierNew) return 0x808080; // Gray
    if(tier === Tier.Tier1) return 0xCD7F32; // Bronze
    if(tier === Tier.Tier2) return 0xC0C0C0; // Silver
    if(tier === Tier.Tier3) return 0xFFD700; // Gold
    if(tier === Tier.Tier4) return 0x40E0D0; // Turquoise (Platinum)
    if(tier === Tier.Tier5) return 0x50C878; // Emerald Green
    if(tier === Tier.Tier6) return 0x00BFFF; // Deep Sky Blue (Diamond)
    if(tier === Tier.Tier7) return 0x9932CC; // Dark Orchid (Master)
    if(tier === Tier.Challenger) return 0xFF4500; // Orange Red (Challenger)
    
    if(tier >= Tier.Tier8 && tier <= Tier.Tier27) {
        return 0xFF1493; // Deep Pink (Top Rankings)
    }
    
    return 0xFFFFFF; // White (Unknown)
}

export enum Tier {
    TierNew = 0,      // Placement matches
    Tier1 = 1,        // Bronze
    Tier2 = 2,        // Silver
    Tier3 = 3,        // Gold
    Tier4 = 4,        // Platinum
    Tier5 = 5,        // Emerald
    Tier6 = 6,        // Diamond
    Tier7 = 7,        // Master
    Challenger = 100, // Above Master but not in Top 20
    
    // Top 20 rankings (Tier8 = Top 1, Tier9 = Top 2, etc.)
    Tier8 = 8,   // Top 1
    Tier9 = 9,   // Top 2
    Tier10 = 10, // Top 3
    Tier11 = 11, // Top 4
    Tier12 = 12, // Top 5
    Tier13 = 13, // Top 6
    Tier14 = 14, // Top 7
    Tier15 = 15, // Top 8
    Tier16 = 16, // Top 9
    Tier17 = 17, // Top 10
    Tier18 = 18, // Top 11
    Tier19 = 19, // Top 12
    Tier20 = 20, // Top 13
    Tier21 = 21, // Top 14
    Tier22 = 22, // Top 15
    Tier23 = 23, // Top 16
    Tier24 = 24, // Top 17
    Tier25 = 25, // Top 18
    Tier26 = 26, // Top 19
    Tier27 = 27  // Top 20
}
