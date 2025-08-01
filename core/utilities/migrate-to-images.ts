import fs from 'fs';
import path from 'path';
import { ServerImage } from '../web/model/ServerImage';

const IMAGES_DIR = path.join(process.cwd(), 'server-images');

if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const defaultConfig = {
    name: "Basic Server",
    description: "Basic Haxball server configuration",
    config: {
        roomName: "Haxball Room",
        playerName: "Host",
        maxPlayers: 16,
        public: true,
        noPlayer: false
    },
    settings: {
        maliciousBehaviourBanCriterion: 3,
        banVoteEnable: true,
        banVoteBanMillisecs: 300000,
        banVoteAllowMinimum: 4,
        banVoteExecuteMinimum: 3,
        afkCountLimit: 12,
        afkCommandAutoKick: true,
        afkCommandAutoKickAllowMillisecs: 180000,
        chatFiltering: false,
        antiJoinFlood: true,
        joinFloodAllowLimitation: 3,
        joinFloodIntervalMillisecs: 10000,
        joinFloodBanMillisecs: 60000,
        antiChatFlood: true,
        chatFloodCriterion: 5,
        chatFloodIntervalMillisecs: 3000,
        antiOgFlood: true,
        ogFloodCriterion: 3,
        ogFloodBanMillisecs: 120000,
        antiBanNoPermission: true,
        banNoPermissionBanMillisecs: 300000,
        antiInsufficientStartAbusing: true,
        insufficientStartAllowLimitation: 3,
        insufficientStartAbusingBanMillisecs: 300000,
        antiPlayerKickAbusing: true,
        playerKickAllowLimitation: 3,
        playerKickIntervalMillisecs: 30000,
        playerKickAbusingBanMillisecs: 300000,
        antiAFKFlood: true,
        antiAFKAbusing: true,
        antiMuteAbusing: true,
        muteAllowIntervalMillisecs: 10000,
        muteDefaultMillisecs: 60000,
        antiGameAbscond: true,
        gameAbscondBanMillisecs: 300000,
        gameAbscondRatingPenalty: 50,
        rerollWinStreak: true,
        rerollWinstreakCriterion: 5,
        guaranteePlayingTime: true,
        guaranteedPlayingTimeSeconds: 60,
        avatarOverridingByTier: true,
        nicknameLengthLimit: 25,
        chatLengthLimit: 140,
        forbidDuplicatedNickname: true,
        nicknameTextFilter: false,
        chatTextFilter: false,
        ballRadius: 6.4,
        ballColor: "0xFFFFFF",
        ballBCoeff: 0.4,
        ballInvMass: 1.5,
        ballDamping: 0.99,
        powershotEnabled: false,
        powershotActivationTime: 1000,
        powershotNormalColor: 0xFFFFFF,
        powershotActiveColor: 0xFF0000,
        powershotInvMassFactor: 0.5,
        powershotCooldown: 3000,
        powershotStickDistance: 15
    },
    rules: {
        ruleName: "Standard Rules",
        ruleDescription: "Standard game rules",
        requisite: {
            minimumPlayers: 4,
            eachTeamPlayers: 3,
            timeLimit: 3,
            scoreLimit: 3,
            teamLock: false
        },
        autoAdmin: true,
        autoOperating: true,
        statsRecord: true,
        defaultMapName: "Classic",
        readyMapName: "Classic"
    },
    helo: {
        factor: {
            placement_match_chances: 10,
            factor_k_placement: 50,
            factor_k_normal: 25,
            factor_k_replace: 15
        },
        tier: {
            class_tier_1: 1000,
            class_tier_2: 1200,
            class_tier_3: 1400,
            class_tier_4: 1600,
            class_tier_5: 1800,
            class_tier_6: 2000,
            class_tier_7: 2200,
            class_tier_8: 2400,
            class_tier_9: 2600
        },
        avatar: {
            avatar_unknown: "🤔",
            avatar_tier_new: "🆕",
            avatar_tier_1: "🥉",
            avatar_tier_2: "🥈",
            avatar_tier_3: "🥇",
            avatar_tier_4: "💎",
            avatar_tier_5: "👑",
            avatar_tier_6: "🏆",
            avatar_tier_7: "⭐",
            avatar_tier_8: "🌟",
            avatar_tier_9: "✨",
            avatar_challenger: "🔥"
        }
    },
    commands: {
        _commandPrefix: "!",
        _helpManabout: "Shows bot info",
        _helpManafk: "Toggle AFK",
        _helpManfreeze: "Freeze chat",
        _helpManhelp: "Show help",
        _helpManlist: "List players",
        _helpManmute: "Mute player",
        _helpManposs: "Ball possession",
        _helpManscout: "Scout player",
        _helpManstats: "Player stats",
        _helpManstatsreset: "Reset stats",
        _helpManstreak: "Win streak",
        _helpManvote: "Vote ban",
        _helpMantier: "Player tier",
        _helpMansuper: "Super admin",
        _helpMannotice: "Set notice",
        _helpManpowershotadmin: "Powershot admin",
        _helpMangoleadores: "Top scorers",
        _helpManasistidores: "Top assisters",
        _helpManranking: "Rankings",
        _helpManavatar: "Change avatar",
        _helpManmap: "Change map",
        _helpManbalance: "Balance teams",
        _listSubafk: "afk",
        _listSubmute: "mute",
        _listSubred: "red",
        _listSubblue: "blue",
        _listSubspec: "spec",
        _superSublogin: "login",
        _superSublogout: "logout",
        _superSubthor: "thor",
        _superSubthordeprive: "thordeprive",
        _superSubkick: "kick",
        _superSubban: "ban",
        about: "about",
        afk: "afk",
        freeze: "freeze",
        help: "help",
        list: "list",
        mute: "mute",
        poss: "poss",
        scout: "scout",
        stats: "stats",
        statsreset: "statsreset",
        streak: "streak",
        super: "super",
        vote: "vote",
        tier: "tier",
        notice: "notice",
        powershotadmin: "powershotadmin",
        goleadores: "goleadores",
        asistidores: "asistidores",
        ranking: "ranking",
        avatar: "avatar",
        map: "map",
        balance: "balance",
        camisetas: "camisetas"
    },
    stadiums: {
        default: "Classic",
        ready: "Classic"
    }
};

export function createDefaultImage() {
    const serverImage: ServerImage = {
        ...defaultConfig,
        ruid: `default_${Date.now()}`,
        version: "1.0.0",
        createdAt: new Date()
    };

    const imageId = `basic_default_${Date.now()}`;
    const imagePath = path.join(IMAGES_DIR, `${imageId}.json`);
    
    fs.writeFileSync(imagePath, JSON.stringify(serverImage, null, 2));
    console.log(`Created default image: ${imageId}`);
    return imageId;
}

if (require.main === module) {
    createDefaultImage();
    console.log('Default server image created!');
}