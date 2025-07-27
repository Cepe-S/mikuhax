// Haxbotron by dapucita
// MAIN OF THE BOT
// ====================================================================================================
// import modules
import * as LangRes from "./resource/strings";
import * as eventListener from "./controller/events/eventListeners";
import * as Tst from "./controller/Translator";
import { Player } from "./model/GameObject/Player";
import { Logger } from "./controller/Logger";
import { PlayerObject } from "./model/GameObject/PlayerObject";
import { ScoresObject } from "./model/GameObject/ScoresObject";
import { KickStack } from "./model/GameObject/BallTrace";
import { getUnixTimestamp } from "./controller/Statistics";
import { TeamID } from "./model/GameObject/TeamID";
import { EmergencyTools } from "./model/ExposeLibs/EmergencyTools";
import { refreshBanVoteCache } from "./model/OperateHelper/Vote";
import { GameRoomConfig } from "./model/Configuration/GameRoomConfig";
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
            feed: false
            ,replayUpload: false
            ,id: ''
            ,token: ''
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

// start main bot script
console.log(`Haxbotron loaded bot script. (UID ${window.gameRoom.config._RUID}, TOKEN ${window.gameRoom.config._config.token})`);
window.document.title = `Haxbotron ${window.gameRoom.config._RUID}`;

makeRoom();
// ====================================================================================================
// set scheduling timers

var scheduledTimer60 = setInterval(() => {
    window.gameRoom._room.sendAnnouncement(LangRes.scheduler.advertise, null, 0x777777, "normal", 0); // advertisement

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
}, 60000); // 60secs

var scheduledTimer5 = setInterval(() => {
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
            window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.scheduler.afkCommandTooLongKick, placeholderScheduler), false); // kick
        }

        // check afk
        if (window.gameRoom.isGamingNow === true && window.gameRoom.isStatRecord === true) { // if the game is in playing
            if (player.team !== TeamID.Spec && player.permissions.afkmode === false) { // if the player is not spectators and not already AFK
                if (player.afktrace.count >= window.gameRoom.config.settings.afkCountLimit) { // if the player's count is over than limit
                    window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.scheduler.afkKick, placeholderScheduler), false); // kick
                } else {
                    // Comentado temporalmente hasta producción
                    // if (player.afktrace.count >= 1) { // only when the player's count is not 0(in activity)
                    //     window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.scheduler.afkDetect, placeholderScheduler), player.id, 0xFF7777, "bold", 2); // warning for all
                    // }
                    player.afktrace.count++; // add afk detection count
                }
            }
        } else {
            if (player.admin == true && player.permissions.afkmode === false) { // if the player is admin and not already AFK
                if (player.afktrace.count >= window.gameRoom.config.settings.afkCountLimit) { // if the player's count is over than limit
                    window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.scheduler.afkKick, placeholderScheduler), false); // kick
                } else {
                    // Comentado temporalmente hasta producción
                    // if (player.afktrace.count >= 1) { // only when the player's count is not 0(in activity)
                    //     window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.scheduler.afkDetect, placeholderScheduler), player.id, 0xFF7777, "bold", 2); // warning for all
                    // }
                    player.afktrace.count++; // add afk detection count
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

    // Ensure stadium data is properly loaded with current config
    try {
        window.gameRoom._room.setCustomStadium(window.gameRoom.stadiumData.training);
        window.gameRoom.logger.i('initialisation', 'Training stadium loaded successfully');
    } catch (error) {
        window.gameRoom.logger.e('initialisation', `Failed to load training stadium: ${error}`);
        // Fallback to a basic stadium if loading fails
        window.gameRoom._room.setCustomStadium('{"name":"Basic Stadium","width":420,"height":200,"spawnDistance":180,"bg":{"type":"","width":0,"height":0,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-420,"y":-200,"trait":"ballArea","cMask":["ball"],"cGroup":["ball"]},{"x":-420,"y":200,"trait":"ballArea","cMask":["ball"],"cGroup":["ball"]},{"x":420,"y":200,"trait":"ballArea","cMask":["ball"],"cGroup":["ball"]},{"x":420,"y":-200,"trait":"ballArea","cMask":["ball"],"cGroup":["ball"]}],"segments":[{"v0":0,"v1":1,"trait":"ballArea","cMask":["ball"],"cGroup":["ball"]},{"v0":1,"v1":2,"trait":"ballArea","cMask":["ball"],"cGroup":["ball"]},{"v0":2,"v1":3,"trait":"ballArea","cMask":["ball"],"cGroup":["ball"]},{"v0":3,"v1":0,"trait":"ballArea","cMask":["ball"],"cGroup":["ball"]}],"goals":[{"p0":[-420,-60],"p1":[-420,60],"team":"red"},{"p0":[420,60],"p1":[420,-60],"team":"blue"}],"discs":[{"radius":6.4,"color":"0","bCoef":0.4,"invMass":1.5,"damping":0.99,"cGroup":["ball","kick","score"]}],"planes":[{"normal":[0,1],"dist":-200,"bCoef":1},{"normal":[0,-1],"dist":-200,"bCoef":1},{"normal":[1,0],"dist":-420,"bCoef":1},{"normal":[-1,0],"dist":-420,"bCoef":1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"],"cGroup":["ball"]}},"playerPhysics":{"bCoef":0,"acceleration":0.11,"kickingAcceleration":0.083,"kickStrength":5},"ballPhysics":"disc0"}');
    }
    
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
    // =========================
}
