// TOP 20 Cache System
interface Top20Player {
    playerAuth: string; // Use auth instead of playerId (more reliable)
    playerName: string;
    rating: number; // Real ELO, not fictional
    rank: number;
}

let top20Cache: Top20Player[] = [];
let cacheLastUpdated: number = 0;

// Update TOP 20 cache (call this at the end of each match)
export function updateTop20Cache(): void {
    try {
        window.gameRoom.logger.i('updateTop20Cache', 'Updating TOP 20 cache...');
        
        // Get all eligible players from database via API
        fetch('/api/v1/ranking/top20')
            .then(response => response.json())
            .then(data => {
                if (data && Array.isArray(data)) {
                    top20Cache = data.slice(0, 20).map((player: any, index: number) => ({
                        playerAuth: player.auth || player.id?.toString() || '', // Use auth, fallback to id as string
                        playerName: player.name,
                        rating: player.elo, // Use real ELO from database
                        rank: index + 1
                    }));
                    cacheLastUpdated = Date.now();
                    window.gameRoom.logger.i('updateTop20Cache', `TOP 20 cache updated with ${top20Cache.length} players`);
                }
            })
            .catch(error => {
                window.gameRoom.logger.e('updateTop20Cache', `Failed to update TOP 20 cache: ${error}`);
                // Fallback to session data if API fails
                updateTop20CacheFromSession();
            });
    } catch (error) {
        window.gameRoom.logger.e('updateTop20Cache', `Error updating TOP 20 cache: ${error}`);
        updateTop20CacheFromSession();
    }
}

// Fallback: Update cache from session data
function updateTop20CacheFromSession(): void {
    try {
        const allPlayers = Array.from(window.gameRoom.playerList.values())
            .filter(p => p.stats.totals >= window.gameRoom.config.HElo.factor.placement_match_chances)
            .sort((a, b) => b.stats.rating - a.stats.rating)
            .slice(0, 20);
        
        top20Cache = allPlayers.map((player, index) => ({
            playerAuth: player.auth, // Use auth instead of playerId
            playerName: player.name,
            rating: player.stats.rating, // Use real ELO from session
            rank: index + 1
        }));
        
        cacheLastUpdated = Date.now();
        window.gameRoom.logger.i('updateTop20CacheFromSession', `TOP 20 cache updated from session with ${top20Cache.length} players`);
    } catch (error) {
        window.gameRoom.logger.e('updateTop20CacheFromSession', `Error updating cache from session: ${error}`);
    }
}

// Check if a player is in TOP 20 using cache
export function isPlayerInTop20(playerId: number): { isTop20: boolean; rank: number; realElo: number } {
    // Auto-update cache if too old (older than 5 minutes) or empty
    if (Date.now() - cacheLastUpdated > 300000 || top20Cache.length === 0) {
        window.gameRoom.logger.i('isPlayerInTop20', `Cache is old or empty. Updating from session data...`);
        updateTop20CacheFromSession(); // Use session data for immediate update
    }
    
    // Get player auth from current session
    const currentPlayer = window.gameRoom.playerList.get(playerId);
    if (!currentPlayer) {
        window.gameRoom.logger.w('isPlayerInTop20', `Player ${playerId} not found in session`);
        return { isTop20: false, rank: 999, realElo: 0 };
    }
    
    const playerAuth = currentPlayer.auth;
    
    // Debug: Log current player lookup
    window.gameRoom.logger.i('isPlayerInTop20', `Looking for playerAuth ${playerAuth} (ID:${playerId}) in cache of ${top20Cache.length} players`);
    
    const topPlayer = top20Cache.find(player => player.playerAuth === playerAuth);
    if (topPlayer) {
        window.gameRoom.logger.i('isPlayerInTop20', `Found player ${playerAuth} at rank ${topPlayer.rank} with ${topPlayer.rating} ELO`);
        return { isTop20: true, rank: topPlayer.rank, realElo: topPlayer.rating };
    }
    
    // Debug: Log cache contents for troubleshooting
    window.gameRoom.logger.i('isPlayerInTop20', `Player ${playerAuth} not found. Cache contains: ${top20Cache.map(p => `${p.playerAuth}:${p.playerName}`).join(', ')}`);
    
    return { isTop20: false, rank: 999, realElo: 0 };
}

// Get TOP 20 cache for external use
export function getTop20Cache(): Top20Player[] {
    return [...top20Cache]; // Return copy to prevent mutations
}

// Force immediate cache update from session data (for debugging)
export function forceUpdateTop20Cache(): void {
    window.gameRoom.logger.i('forceUpdateTop20Cache', 'Forcing immediate cache update from session data...');
    updateTop20CacheFromSession();
}

// Debug function to check cache status
export function debugTop20Cache(): string {
    const cacheInfo = {
        cacheSize: top20Cache.length,
        lastUpdated: new Date(cacheLastUpdated).toLocaleString(),
        cacheAge: Date.now() - cacheLastUpdated,
        players: top20Cache.map(p => `${p.rank}. ${p.playerName} (Auth:${p.playerAuth}, ELO:${p.rating})`)
    };
    
    window.gameRoom.logger.i('debugTop20Cache', JSON.stringify(cacheInfo, null, 2));
    return JSON.stringify(cacheInfo, null, 2);
}

export function decideTier(rating: number, playerId?: number): Tier {
    // Check if player is in placement matches
    if (playerId && isInPlacementMatches(playerId)) {
        return Tier.TierNew;
    }

    // Check for TOP 20 rankings first (overrides rating-based tiers)
    if (playerId) {
        const top20Check = isPlayerInTop20(playerId);
        if (top20Check.isTop20) {
            return (Tier.Tier8 + (top20Check.rank - 1)) as Tier; // Top 1-20
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

// Get display ELO for a player (returns real ELO always)
export function getDisplayElo(playerId: number, actualElo: number): number {
    // Always return real ELO, no fictional ELOs
    return actualElo;
}

// Get the complete display name for a player including tier prefix
export function getPlayerDisplayName(playerId: number, playerName: string, isAdmin: boolean = false, isSuperAdmin: boolean = false): string {
    try {
        const player = window.gameRoom.playerList.get(playerId);
        if (!player) return playerName; // Fallback to basic name
        
        const tier = decideTier(player.stats.rating, playerId);
        const tierName = getTierName(tier, playerId);
        
        // Build name with tier prefix
        const superAdminIndicator = isSuperAdmin ? '👑' : '';
        const adminIndicator = isAdmin ? '⭐' : '';
        
        return `${tierName} ${superAdminIndicator}${adminIndicator}${playerName}`;
    } catch (error) {
        window.gameRoom.logger.e('getPlayerDisplayName', `Error getting display name: ${error}`);
        return playerName; // Fallback to basic name
    }
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
    
    // Handle TOP rankings - use cache system for accurate ranking with real ELO
    if(tier >= Tier.Tier8 && tier <= Tier.Tier27) {
        let rank = 999;
        let realElo = 0;
        
        if (playerId) {
            const top20Check = isPlayerInTop20(playerId);
            if (top20Check.isTop20) {
                rank = top20Check.rank;
                realElo = top20Check.realElo;
            } else {
                // Fallback: calculate rank from tier enum value and get real ELO from player
                rank = tier - Tier.Tier8 + 1;
                const player = window.gameRoom.playerList.get(playerId);
                realElo = player ? player.stats.rating : 0;
            }
        } else {
            // If no playerId, calculate rank from tier enum value
            rank = tier - Tier.Tier8 + 1;
            realElo = 0; // No ELO available without playerId
        }

        return realElo > 0 ? `✨TOP ${rank}🏆✨ (${Math.round(realElo)})` : `🏆${rank}°🏆`;
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

    // Handle TOP rankings - use cache system for accurate ranking with real ELO
    if (tier >= Tier.Tier8 && tier <= Tier.Tier27) {
        let rank = 999;
        let realElo = 0;
        
        if (playerId) {
            const top20Check = isPlayerInTop20(playerId);
            if (top20Check.isTop20) {
                rank = top20Check.rank;
                realElo = top20Check.realElo;
            } else {
                // Fallback: calculate rank from tier enum value and get real ELO from player
                rank = tier - Tier.Tier8 + 1;
                const player = window.gameRoom.playerList.get(playerId);
                realElo = player ? player.stats.rating : 0;
            }
        } else {
            // If no playerId, calculate rank from tier enum value
            rank = tier - Tier.Tier8 + 1;
            realElo = 0; // No ELO available without playerId
        }
        
        // Format: 🏆1°🏆 with real ELO for TOP rankings
        return realElo > 0 ? `🏆${rank}°🏆 (${Math.round(realElo)} ELO)` : `🏆${rank}°🏆`;
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
