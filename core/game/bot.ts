// Haxbotron by dapucita - Simplified version
import * as LangRes from "./resource/strings";
import * as eventListener from "./controller/events/eventListeners";
import * as Tst from "./controller/Translator";
import { Player } from "./model/GameObject/Player";
import { Logger, LogLevel } from "./controller/Logger";
import { PlayerObject } from "./model/GameObject/PlayerObject";
import { ScoresObject } from "./model/GameObject/ScoresObject";
import { KickStack } from "./model/GameObject/BallTrace";
import { getUnixTimestamp } from "./controller/Statistics";
import { TeamID } from "./model/GameObject/TeamID";
import { GameRoomConfig } from "./model/Configuration/GameRoomConfig";
import { setDefaultStadiums, setRandomTeamColors } from './controller/RoomTools';
import { getRandomMatch } from './resource/realTeams';
import { BalanceManager } from './controller/balance/BalanceManager';
import { BalanceMode } from './controller/balance/BalanceConfig';
import { afkManager } from './controller/AFKManager';

// Load initial configurations
const loadedConfig: GameRoomConfig = JSON.parse(localStorage.getItem('_initConfig')!);

// Initialize team colors with random match
let initialTeamColors = {
    red: {
        angle: 0,
        textColour: 0xFFFFFF,
        teamColour1: 0xE56E56,
        teamColour2: 0xE56E56,
        teamColour3: 0xE56E56
    },
    blue: {
        angle: 0,
        textColour: 0xFFFFFF,
        teamColour1: 0x5689E5,
        teamColour2: 0x5689E5,
        teamColour3: 0x5689E5
    }
};

// Try to get random team colors
try {
    const randomMatch = getRandomMatch();
    if (randomMatch) {
        initialTeamColors = {
            red: {
                angle: randomMatch.red.angle,
                textColour: randomMatch.red.textColour,
                teamColour1: randomMatch.red.teamColour1,
                teamColour2: randomMatch.red.teamColour2 || randomMatch.red.teamColour1,
                teamColour3: randomMatch.red.teamColour3 || randomMatch.red.teamColour1
            },
            blue: {
                angle: randomMatch.blue.angle,
                textColour: randomMatch.blue.textColour,
                teamColour1: randomMatch.blue.teamColour1,
                teamColour2: randomMatch.blue.teamColour2 || randomMatch.blue.teamColour1,
                teamColour3: randomMatch.blue.teamColour3 || randomMatch.blue.teamColour1
            }
        };
        console.log(`🎽 Teams selected: ${randomMatch.blue.name} vs ${randomMatch.red.name}`);
    }
} catch (error) {
    console.warn('Failed to load random team colors, using defaults:', error);
}

window.gameRoom = {
    _room: window.HBInit(loadedConfig._config),
    config: loadedConfig,
    link: '',
    social: {
        discordWebhook: {
            replayUrl: '',
            adminCallUrl: '',
            serverStatusUrl: '',
            dailyStatsUrl: '',
            dailyStatsTime: '',
            replayUpload: false
        }
    },
    stadiumData: {
        default: localStorage.getItem('_defaultMap')!,
        training: localStorage.getItem('_readyMap')!
    },
    bannedWordsPool: {
        nickname: [],
        chat: []
    },
    teamColours: initialTeamColors,
    logger: Logger.getInstance(),
    isStatRecord: false,
    isGamingNow: false,
    isMuteAll: false,
    playerList: new Map(),
    ballStack: KickStack.getInstance(),
    banVoteCache: [],
    winningStreak: { count: 0, teamID: TeamID.Spec },
    antiTrollingOgFloodCount: [],
    antiTrollingChatFloodCount: [],
    antiInsufficientStartAbusingCount: [],
    antiPlayerKickAbusingCount: [],
    notice: '',
    onEmergency: {
        list: () => console.log('Emergency list'),
        chat: (msg: string, playerID?: number) => console.log('Emergency chat:', msg),
        kick: (playerID: number, msg?: string) => console.log('Emergency kick:', playerID),
        ban: (playerID: number, msg?: string) => console.log('Emergency ban:', playerID),
        password: (password?: string) => console.log('Emergency password')
    },
    matchEventsHolder: [],
    memideCooldowns: new Map(),
    memideUsedValues: new Map(),
    balanceManager: new BalanceManager()
}

// Clear localStorage
localStorage.removeItem('_initConfig');
localStorage.removeItem('_defaultMap');
localStorage.removeItem('_readyMap');

// Configure logging
window.gameRoom.logger.setLogLevel(LogLevel.INFO);

// Start bot
console.log(`Haxbotron loaded bot script. (UID ${window.gameRoom.config._RUID}, TOKEN ${window.gameRoom.config._config.token})`);
window.document.title = `Haxbotron ${window.gameRoom.config._RUID}`;

makeRoom();

// Simple scheduler - only advertisement
var scheduledTimer60 = setInterval(() => {
    window.gameRoom._room.sendAnnouncement(LangRes.scheduler.advertise, null, 0x7289DA, "normal", 0);
}, 300000);

// Start AFK Manager
afkManager.start();

function makeRoom(): void {
    window.gameRoom.logger.i('initialisation', `The game room is opened at ${window.gameRoom.config._LaunchDate.toLocaleString()}.`);

    window.gameRoom._room.setScoreLimit(window.gameRoom.config.rules.requisite.scoreLimit);
    window.gameRoom._room.setTimeLimit(window.gameRoom.config.rules.requisite.timeLimit);
    window.gameRoom._room.setTeamsLock(window.gameRoom.config.rules.requisite.teamLock);

    // Initialize powershot system
    if (window.gameRoom.ballStack) {
        window.gameRoom.ballStack.initPowershotSystem();
        window.gameRoom.logger.i('initialisation', 'Powershot system initialized');
    }

    // Initialize balance system
    const balanceConfig = {
        enabled: window.gameRoom.config.settings.balanceEnabled !== false,
        mode: (window.gameRoom.config.rules.balanceMode as BalanceMode) || BalanceMode.JT,
        maxPlayersPerTeam: window.gameRoom.config.rules.requisite.eachTeamPlayers || 4
    };
    window.gameRoom.balanceManager.setConfig(balanceConfig);
    window.gameRoom.logger.i('initialisation', `Balance system initialized: ${balanceConfig.enabled ? 'enabled' : 'disabled'}, mode: ${balanceConfig.mode}, max per team: ${balanceConfig.maxPlayersPerTeam}`);
    
    // Log AFK system status
    window.gameRoom.logger.i('initialisation', `AFK auto-kick system: ${window.gameRoom.config.settings.afkCommandAutoKick ? 'enabled' : 'disabled'}, timeout: ${Math.floor(window.gameRoom.config.settings.afkCommandAutoKickAllowMillisecs / 60000)} minutes`);

    // Apply team colors
    try {
        window.gameRoom._room.setTeamColors(1, window.gameRoom.teamColours.red.angle, window.gameRoom.teamColours.red.textColour, [window.gameRoom.teamColours.red.teamColour1, window.gameRoom.teamColours.red.teamColour2, window.gameRoom.teamColours.red.teamColour3]);
        window.gameRoom._room.setTeamColors(2, window.gameRoom.teamColours.blue.angle, window.gameRoom.teamColours.blue.textColour, [window.gameRoom.teamColours.blue.teamColour1, window.gameRoom.teamColours.blue.teamColour2, window.gameRoom.teamColours.blue.teamColour3]);
        window.gameRoom.logger.i('initialisation', 'Team colors applied successfully');
    } catch (error) {
        window.gameRoom.logger.w('initialisation', `Failed to apply team colors: ${error}`);
    }

    // Link Event Listeners
    window.gameRoom._room.onPlayerJoin = async (player: PlayerObject): Promise<void> => await eventListener.onPlayerJoinListener(player);
    window.gameRoom._room.onPlayerLeave = async (player: PlayerObject): Promise<void> => await eventListener.onPlayerLeaveListener(player);
    window.gameRoom._room.onTeamVictory = async (scores: ScoresObject): Promise<void> => await eventListener.onTeamVictoryListener(scores);
    window.gameRoom._room.onPlayerChat = (player: PlayerObject, message: string): boolean => eventListener.onPlayerChatListener(player, message);
    window.gameRoom._room.onPlayerBallKick = (player: PlayerObject): void => eventListener.onPlayerBallKickListener(player);
    window.gameRoom._room.onTeamGoal = async (team: TeamID): Promise<void> => await eventListener.onTeamGoalListener(team);
    window.gameRoom._room.onGameStart = (byPlayer: PlayerObject): void => eventListener.onGameStartListener(byPlayer);
    window.gameRoom._room.onGameStop = (byPlayer: PlayerObject): void => eventListener.onGameStopListener(byPlayer);
    window.gameRoom._room.onPlayerAdminChange = (changedPlayer: PlayerObject, byPlayer: PlayerObject): void => eventListener.onPlayerAdminChangeListener(changedPlayer, byPlayer);
    window.gameRoom._room.onPlayerTeamChange = (changedPlayer: PlayerObject, byPlayer: PlayerObject): void => eventListener.onPlayerTeamChangeListener(changedPlayer, byPlayer);
    window.gameRoom._room.onPlayerKicked = (kickedPlayer: PlayerObject, reason: string, ban: boolean, byPlayer: PlayerObject): void => eventListener.onPlayerKickedListener(kickedPlayer, reason, ban, byPlayer);
    window.gameRoom._room.onGameTick = (): void => eventListener.onGameTickListener();
    window.gameRoom._room.onGamePause = (byPlayer: PlayerObject): void => eventListener.onGamePauseListener(byPlayer);
    window.gameRoom._room.onGameUnpause = (byPlayer: PlayerObject): void => eventListener.onGameUnpauseListener(byPlayer);
    window.gameRoom._room.onPositionsReset = (): void => eventListener.onPositionsResetListener();
    window.gameRoom._room.onPlayerActivity = (player: PlayerObject): void => eventListener.onPlayerActivityListener(player);
    window.gameRoom._room.onStadiumChange = (newStadiumName: string, byPlayer: PlayerObject): void => eventListener.onStadiumChangeListner(newStadiumName, byPlayer);
    window.gameRoom._room.onRoomLink = (url: string): void => eventListener.onRoomLinkListener(url);
    window.gameRoom._room.onKickRateLimitSet = (min: number, rate: number, burst: number, byPlayer: PlayerObject): void => eventListener.onKickRateLimitSetListener(min, rate, burst, byPlayer);
    
    setDefaultStadiums();
}