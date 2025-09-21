// Stub Tier system for player ranking
export enum Tier {
    BRONZE = 'BRONZE',
    SILVER = 'SILVER',
    GOLD = 'GOLD',
    PLATINUM = 'PLATINUM',
    DIAMOND = 'DIAMOND',
    MASTER = 'MASTER'
}

export function decideTier(rating: number): Tier {
    if (rating < 1000) return Tier.BRONZE;
    if (rating < 1200) return Tier.SILVER;
    if (rating < 1400) return Tier.GOLD;
    if (rating < 1600) return Tier.PLATINUM;
    if (rating < 1800) return Tier.DIAMOND;
    return Tier.MASTER;
}

export function getAvatarByTier(tier: Tier): string {
    switch (tier) {
        case Tier.BRONZE: return '🥉';
        case Tier.SILVER: return '🥈';
        case Tier.GOLD: return '🥇';
        case Tier.PLATINUM: return '💎';
        case Tier.DIAMOND: return '💠';
        case Tier.MASTER: return '👑';
        default: return '⚪';
    }
}

export function getTierName(tier: Tier): string {
    return tier.toString();
}

export function getTierColor(tier: Tier): number {
    switch (tier) {
        case Tier.BRONZE: return 0xCD7F32;
        case Tier.SILVER: return 0xC0C0C0;
        case Tier.GOLD: return 0xFFD700;
        case Tier.PLATINUM: return 0xE5E4E2;
        case Tier.DIAMOND: return 0xB9F2FF;
        case Tier.MASTER: return 0xFF6B6B;
        default: return 0xFFFFFF;
    }
}

export function getPlayerDisplayName(playerId: number, name?: string, isAdmin?: boolean, isSuperAdmin?: boolean): string {
    const player = window.gameRoom.playerList.get(playerId);
    if (!player && !name) return 'Unknown';
    
    const playerName = name || player?.name || 'Unknown';
    const rating = player?.stats.rating || 1000;
    const tier = decideTier(rating);
    const avatar = getAvatarByTier(tier);
    
    let prefix = '';
    if (isSuperAdmin) prefix = '👑 ';
    else if (isAdmin) prefix = '🛡️ ';
    
    return `${prefix}${avatar} ${playerName}`;
}

// Top 20 cache functions
const top20Cache = new Map<string, any>();

export function debugTop20Cache(): string {
    const cacheEntries = Array.from(top20Cache.entries());
    return `Top 20 Cache: ${cacheEntries.length} entries - ${JSON.stringify(cacheEntries)}`;
}

export function clearTop20Cache(): void {
    top20Cache.clear();
}

export function isPlayerInTop20(playerId: number): { isTop20: boolean; rank?: number; realElo?: number } {
    // Stub implementation
    const player = window.gameRoom.playerList.get(playerId);
    return {
        isTop20: false,
        rank: undefined,
        realElo: player?.stats.rating || 1000
    };
}