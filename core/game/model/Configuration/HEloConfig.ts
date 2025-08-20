export interface HEloConfig {
    factor: {
        placement_match_chances: number     // 30 (Chess.com provisional games)
        factor_k_placement: number          // 40 (provisional K-factor)
        factor_k_normal: number             // 24 (normal K-factor)
        factor_k_replace: number            // 16 (high rating K-factor)
    }
    tier: {
        class_tier_1: number               // 400 (Novice)
        class_tier_2: number               // 800 (Intermediate)
        class_tier_3: number               // 1200 (Advanced)
        class_tier_4: number               // 1600 (Expert)
        class_tier_5: number               // 2000 (Master)
        class_tier_6: number               // 2400 (Grandmaster)
        class_tier_7: number               // 2800 (Super GM)
        class_tier_8: number               // 3000 (Elite)
        class_tier_9: number               // 3200 (Maximum)
    }
    avatar: {
        avatar_unknown: string
        avatar_tier_new: string            // Provisional
        avatar_tier_1: string              // Novice
        avatar_tier_2: string              // Intermediate  
        avatar_tier_3: string              // Advanced
        avatar_tier_4: string              // Expert
        avatar_tier_5: string              // Master
        avatar_tier_6: string              // Grandmaster
        avatar_tier_7: string              // Super GM
        avatar_tier_8: string              // Elite
        avatar_tier_9: string              // Maximum
        avatar_challenger: string          // Special
    }
}

// Chess.com style default configuration
export const defaultChessComConfig: HEloConfig = {
    factor: {
        placement_match_chances: 30,
        factor_k_placement: 40,
        factor_k_normal: 24,
        factor_k_replace: 12
    },
    tier: {
        class_tier_1: 400,
        class_tier_2: 800,
        class_tier_3: 1200,
        class_tier_4: 1600,
        class_tier_5: 2000,
        class_tier_6: 2400,
        class_tier_7: 2800,
        class_tier_8: 3000,
        class_tier_9: 3200
    },
    avatar: {
        avatar_unknown: "❓",
        avatar_tier_new: "🔰",
        avatar_tier_1: "🥉",
        avatar_tier_2: "🥈",
        avatar_tier_3: "🥇",
        avatar_tier_4: "💎",
        avatar_tier_5: "👑",
        avatar_tier_6: "🏆",
        avatar_tier_7: "⭐",
        avatar_tier_8: "🌟",
        avatar_tier_9: "💫",
        avatar_challenger: "🔥"
    }
};
