// Haxbotron by dapucita
// MAIN OF THE BOT
// ====================================================================================================
// import modules
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
import { EmergencyTools } from "./model/ExposeLibs/EmergencyTools";
import { refreshBanVoteCache } from "./model/OperateHelper/Vote";
import { GameRoomConfig } from "./model/Configuration/GameRoomConfig";
import { setDefaultStadiums } from './controller/RoomTools';
import { updateTop20Cache } from './model/Statistics/Tier';
// ====================================================================================================
// load initial configurations
const loadedConfig: GameRoomConfig = JSON.parse(localStorage.getItem('_initConfig')!);


window.gameRoom = {
    
// Reiniciar eventos al inicio de cada partido
    
    _room: window.HBInit(loadedConfig._config)
    ,config: loadedConfig
    ,link: ''
    ,social: {
        discordWebhook: {
            replayUrl: '',
            adminCallUrl: '',
            serverStatusUrl: '',
            dailyStatsUrl: '',
            dailyStatsTime: '',
            replayUpload: false
        }
    }
    ,stadiumData: {
        default: localStorage.getItem('_defaultMap')!
        ,training: localStorage.getItem('_readyMap')!
    }
    ,bannedWordsPool: {
        nickname: []
        ,chat: []
    }
    ,teamColours: {
        red: { angle: 0, textColour: 0xffffff, teamColour1: 0xe66e55, teamColour2: 0xe66e55, teamColour3: 0xe66e55 }
        ,blue: { angle: 0, textColour: 0xffffff, teamColour1: 0x5a89e5, teamColour2: 0x5a89e5, teamColour3: 0x5a89e5 }
    }
    ,logger: Logger.getInstance() 
    ,isStatRecord: false
    ,isGamingNow: false
    ,isMuteAll: false
    ,playerList: new Map()
    ,ballStack: KickStack.getInstance()
    ,banVoteCache: []
    ,winningStreak: { count: 0, teamID: TeamID.Spec }
    ,antiTrollingOgFloodCount: []
    ,antiTrollingChatFloodCount: []
    ,antiInsufficientStartAbusingCount: []
    ,antiPlayerKickAbusingCount: []
    ,notice: ''
    ,onEmergency: EmergencyTools
    ,matchEventsHolder: [] // Almacena eventos del partido actual
}

// clear localStorage
localStorage.removeItem('_initConfig');
localStorage.removeItem('_defaultMap');
localStorage.removeItem('_readyMap');

// Configure optimized logging
window.gameRoom.logger.setLogLevel(LogLevel.INFO); // Set to INFO level to reduce verbosity

// start main bot script
console.log(`Haxbotron loaded bot script. (UID ${window.gameRoom.config._RUID}, TOKEN ${window.gameRoom.config._config.token})`);
window.document.title = `Haxbotron ${window.gameRoom.config._RUID}`;

makeRoom();
// ====================================================================================================
// set scheduling timers

var scheduledTimer60 = setInterval(() => {
    window.gameRoom._room.sendAnnouncement(LangRes.scheduler.advertise, null, 0x7289DA, "normal", 0); // advertisement

    refreshBanVoteCache(); // update banvote status cache
    if (window.gameRoom.banVoteCache.length >= 1) { // if there are some votes (include top voted players only)
        let placeholderVote = {
            voteList: ''
        }
        for (let i: number = 0; i < window.gameRoom.banVoteCache.length; i++) {
            if (window.gameRoom.playerList.has(window.gameRoom.banVoteCache[i])) {
                placeholderVote.voteList += `${window.gameRoom.playerList.get(window.gameRoom.banVoteCache[i])!.name}#${window.gameRoom.banVoteCache[i]} `;
            }
        }
        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.scheduler.banVoteAutoNotify, placeholderVote), null, 0x00FF00, "normal", 0); //notify it
    }
    
    // Clean expired bans automatically every 5 minutes
    if (typeof window._cleanExpiredBansDB === 'function') {
        window._cleanExpiredBansDB(window.gameRoom.config._RUID).then((clearedCount: number) => {
            if (clearedCount > 0) {
                window.gameRoom.logger.i('scheduler', `Auto-cleared ${clearedCount} expired bans`);
            }
        }).catch((error: any) => {
            window.gameRoom.logger.w('scheduler', `Error during auto-cleanup of expired bans: ${error}`);
        });
    }
}, 300000); // 300secs (5 minutes)

var scheduledTimer5 = setInterval(() => {
    // AFK detection and auto-kick system
    // Superadmins are exempt from all AFK kicks to prevent accidental removal of administrators
    const nowTimeStamp: number = getUnixTimestamp(); //get timestamp

    let placeholderScheduler = {
        targetID: 0,
        targetName: '',
    }

    window.gameRoom.playerList.forEach((player: Player) => { // afk detection system & auto unmute system
        // init placeholder
        placeholderScheduler.targetID = player.id;
        placeholderScheduler.targetName = player.name;

        // check muted player and unmute when it's time to unmute
        if (player.permissions.mute === true && player.permissions.muteExpire !== -1 && nowTimeStamp > player.permissions.muteExpire) {
            player.permissions.mute = false; //unmute
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.scheduler.autoUnmute, placeholderScheduler), null, 0x479947, "normal", 0); //notify it
            window._emitSIOPlayerStatusChangeEvent(player.id);
        }

        // when afk too long kick option is enabled, then check sleeping with afk command and kick if afk too long
        if (window.gameRoom.config.settings.afkCommandAutoKick === true && player.permissions.afkmode === true && nowTimeStamp > player.permissions.afkdate + window.gameRoom.config.settings.afkCommandAutoKickAllowMillisecs) {
            // Don't kick superadmins for being AFK too long
            if (!player.permissions.superadmin) {
                window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.scheduler.afkCommandTooLongKick, placeholderScheduler), false); // kick
            }
        }

        // check afk - Sistema basado en tiempo real desde settings
        if (window.gameRoom.isGamingNow === true && window.gameRoom.isStatRecord === true) { 
            // Durante el juego: verificar jugadores en equipos (Red/Blue) que no estén ya en modo AFK manual
            if (player.team !== TeamID.Spec && player.permissions.afkmode === false) {
                // Usar tiempo real de inactividad basado en afkCommandAutoKickAllowMillisecs
                const inactiveTime = nowTimeStamp - (player.permissions.lastActivityTime || nowTimeStamp);
                const maxAfkTime = window.gameRoom.config.settings.afkCommandAutoKickAllowMillisecs;
                
                if (inactiveTime >= maxAfkTime) {
                    // Don't kick superadmins for being AFK during games
                    if (!player.permissions.superadmin) {
                        window.gameRoom.logger.i('afk-system', `Kicking player ${player.name}#${player.id} for AFK during game (inactive for ${Math.floor(inactiveTime/1000)}s)`);
                        window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.scheduler.afkKick, placeholderScheduler), false);
                    } else {
                        // Para superadmins, resetear tiempo de actividad
                        player.permissions.lastActivityTime = nowTimeStamp;
                        window.gameRoom.logger.i('afk-system', `Superadmin ${player.name}#${player.id} AFK time reset`);
                    }
                } else {
                    // Advertencia cuando quedan 30 segundos
                    const remainingTime = maxAfkTime - inactiveTime;
                    if (remainingTime <= 30000 && remainingTime > 15000) {
                        window.gameRoom._room.sendAnnouncement(
                            `⚠️ ${player.name}, estás inactivo. Muévete o serás expulsado en ${Math.floor(remainingTime/1000)}s`,
                            player.id, 0xFF7777, "bold", 2
                        );
                    }
                }
            }
        } else {
            // Fuera del juego: solo verificar admins que no estén en modo AFK manual
            if (player.admin === true && player.permissions.afkmode === false) {
                const inactiveTime = nowTimeStamp - (player.permissions.lastActivityTime || nowTimeStamp);
                const maxAfkTime = window.gameRoom.config.settings.afkCommandAutoKickAllowMillisecs;
                
                if (inactiveTime >= maxAfkTime) {
                    // Don't kick superadmins for being AFK outside games
                    if (!player.permissions.superadmin) {
                        window.gameRoom.logger.i('afk-system', `Kicking admin ${player.name}#${player.id} for AFK outside game (inactive for ${Math.floor(inactiveTime/1000)}s)`);
                        window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.scheduler.afkKick, placeholderScheduler), false);
                    } else {
                        player.permissions.lastActivityTime = nowTimeStamp;
                    }
                }
            }
        }
    });
}, 15 * 1000); // afk time allowed 15secs
// ====================================================================================================
// declare functions
function makeRoom(): void {
    window.gameRoom.logger.i('initialisation', `The game room is opened at ${window.gameRoom.config._LaunchDate.toLocaleString()}.`);

    window.gameRoom.logger.i('initialisation', `The game mode is '${window.gameRoom.isGamingNow}' now(by default).`);

    // Stadium will be loaded automatically based on player count via setDefaultStadiums()
    
    window.gameRoom._room.setScoreLimit(window.gameRoom.config.rules.requisite.scoreLimit);
    window.gameRoom._room.setTimeLimit(window.gameRoom.config.rules.requisite.timeLimit);
    window.gameRoom._room.setTeamsLock(window.gameRoom.config.rules.requisite.teamLock);

    // Linking Event Listeners
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
    
    // Asegurar que el mapa correcto se carga al inicio (ready mode por defecto)
    setDefaultStadiums();
    
    // Initialize TOP 20 cache at startup
    setTimeout(() => {
        updateTop20Cache();
    }, 5000); // Wait 5 seconds after room creation to ensure everything is ready
    // =========================
}
