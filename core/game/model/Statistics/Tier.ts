export function decideTier(rating: number, playerId?: number): Tier {
    // Check if player is in placement matches
    if (playerId && isInPlacementMatches(playerId)) {
        return Tier.TierNew;
    }

    // Standard tier system (Bronze to Master)
    if(rating < window.gameRoom.config.HElo.tier.class_tier_2) return Tier.Tier1; // Bronze
    if(rating < window.gameRoom.config.HElo.tier.class_tier_3) return Tier.Tier2; // Silver
    if(rating < window.gameRoom.config.HElo.tier.class_tier_4) return Tier.Tier3; // Gold
    if(rating < window.gameRoom.config.HElo.tier.class_tier_5) return Tier.Tier4; // Platinum
    if(rating < window.gameRoom.config.HElo.tier.class_tier_6) return Tier.Tier5; // Emerald
    if(rating < window.gameRoom.config.HElo.tier.class_tier_7) return Tier.Tier6; // Diamond
    if(rating < window.gameRoom.config.HElo.tier.class_tier_8) return Tier.Tier7; // Master

    // High tier system (Challenger and Top rankings)
    if (playerId) {
        const playerRank = getPlayerRank(playerId);
        if (playerRank <= 20) {
            return (Tier.Tier8 + (playerRank - 1)) as Tier; // Top 1-20
        }
    }
    
    return Tier.Challenger; // Above Master but not in Top 20
}

function isInPlacementMatches(playerId: number): boolean {
    const player = window.gameRoom.playerList.get(playerId);
    if (!player) return false;
    return player.stats.totals < window.gameRoom.config.HElo.factor.placement_match_chances;
}

function getPlayerRank(playerId: number): number {
    const allPlayers = Array.from(window.gameRoom.playerList.values())
        .filter(p => p.stats.totals >= window.gameRoom.config.HElo.factor.placement_match_chances)
        .sort((a, b) => b.stats.rating - a.stats.rating);
    
    const playerIndex = allPlayers.findIndex(p => p.id === playerId);
    return playerIndex + 1;
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
    
    // Top 20 players get special rank indicators
    if(tier >= Tier.Tier8 && tier <= Tier.Tier27 && playerId) {
        const rank = getPlayerRank(playerId);
        return `#${rank}`;
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
        const rank = getPlayerRank(playerId);
        return `【⌈✨🌸✨⌋】 TOP ${rank}`;
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
