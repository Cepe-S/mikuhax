import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { Player } from "../../model/GameObject/Player";
import { convertToPlayerStorage, getBanlistDataFromDB, getPlayerDataFromDB, removeBanlistDataFromDB, setBanlistDataToDB, setPlayerDataToDB } from "../Storage";
import { getUnixTimestamp } from "../Statistics";
import { setDefaultStadiums, updateAdmins } from "../RoomTools";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { recuritByOne, roomActivePlayersNumberCheck, roomTeamPlayersNumberCheck, assignPlayerToBalancedTeam, getTeamsEloInfo } from "../../model/OperateHelper/Quorum";
import { decideTier, getAvatarByTier, getTierName, getTierColor, Tier } from "../../model/Statistics/Tier";
import { isExistNickname, isIncludeBannedWords } from "../TextFilter";

export async function onPlayerJoinListener(player: PlayerObject): Promise<void> {
    const joinTimeStamp: number = getUnixTimestamp();

    // logging into console
    window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} has joined. CONN(${player.conn}),AUTH(${player.auth})`);

    // Event called when a new player joins the room.
    var placeholderJoin = {
        playerID: player.id,
        playerName: player.name,
        playerNameOld: player.name,
        playerStatsRating: 1000,
        playerStatsDisconns: 0,
        playerStatsTotal: 0,
        playerStatsWins: 0,
        playerStatsGoals: 0,
        playerStatsAssists: 0,
        playerStatsOgs: 0,
        playerStatsLosepoints: 0,
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count,
        banListReason: ''
    };

    // check ban list
    let playerBanChecking = await getBanlistDataFromDB(player.conn);
    if (playerBanChecking !== undefined) {// if banned (bListCheck would had returned string or boolean)
        placeholderJoin.banListReason = playerBanChecking.reason;

        if (playerBanChecking.expire == -1) { // Permanent ban
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in permanent ban list. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.permanentBan, placeholderJoin), true); // auto ban
            return;
        }
        if (playerBanChecking.expire > joinTimeStamp) { // Fixed-term ban (time limited ban)
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in fixed-term ban list. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.fixedTermBan, placeholderJoin), false); // auto kick
            return;
        }
        if (playerBanChecking.expire != -1 && playerBanChecking.expire <= joinTimeStamp) { // time-over from expiration date
            // ban clear for this player
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} is deleted from the ban list because the date has expired. (conn:${player.conn},reason:${playerBanChecking.reason})`);
            await removeBanlistDataFromDB(player.conn);
            // window.room.clearBan(player.id); //useless cuz banned player in haxball couldn't make join-event.
        }
    }

    // if this player use seperator (|,|) in nickname, then kick
    if (player.name.includes('|,|')) {
        window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for including seperator word. (|,|)`);
        window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.includeSeperator, placeholderJoin), false); // kick
        return;
    }
    
    // PERMITIR IPs DUPLICADAS - Comentado el check de double joining
    /*if this player has already joinned by other connection
    for (let eachPlayer of window.gameRoom.playerList.values()) {
        if(eachPlayer.conn === player.conn) {
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for double joinning. (origin:${eachPlayer.name}#${eachPlayer.id},conn:${player.conn})`);
            window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.doubleJoinningKick, placeholderJoin), false); // kick
            //window.room.sendAnnouncement(Tst.maketext(LangRes.onJoin.doubleJoinningMsg, placeholderJoin), null, 0xFF0000, "normal", 0); // notify
            return; // exit from this join event
        }
    }*/

    // Name length limit removed - players can use names of any length

    // if player's nickname is already used (duplicated nickname)
    if (window.gameRoom.config.settings.forbidDuplicatedNickname === true && isExistNickname(player.name) === true) {
        window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for duplicated nickname.`);
        window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.duplicatedNickname, placeholderJoin), false); // kick
        return;
    }

    // if player's nickname includes some banned words
    if (window.gameRoom.config.settings.nicknameTextFilter === true && isIncludeBannedWords(window.gameRoom.bannedWordsPool.nickname, player.name) === true) {
        window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for including banned word(s).`);
        window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.bannedNickname, placeholderJoin), false); // kick
        return;
    }

    // add the player who joined into playerList by creating class instance
    let existPlayerData = await getPlayerDataFromDB(player.auth);
    if (existPlayerData !== undefined) {
        // if this player is existing player (not new player)
        window.gameRoom.playerList.set(player.id, new Player(player, {
            rating: existPlayerData.rating,
            totals: existPlayerData.totals,
            disconns: existPlayerData.disconns,
            wins: existPlayerData.wins,
            goals: existPlayerData.goals,
            assists: existPlayerData.assists,
            ogs: existPlayerData.ogs,
            losePoints: existPlayerData.losePoints,
            balltouch: existPlayerData.balltouch,
            passed: existPlayerData.passed
        }, {
            mute: existPlayerData.mute,
            muteExpire: existPlayerData.muteExpire,
            afkmode: false,
            afkreason: '',
            afkdate: 0,
            malActCount: existPlayerData.malActCount,
            superadmin: false,
            lastPowershotUse: 0
        }, {
            rejoinCount: existPlayerData.rejoinCount,
            joinDate: joinTimeStamp,
            leftDate: existPlayerData.leftDate,
            matchEntryTime: 0
        }));

        // update player information in placeholder
        placeholderJoin.playerStatsAssists = existPlayerData.assists;
        placeholderJoin.playerStatsGoals = existPlayerData.goals;
        placeholderJoin.playerStatsLosepoints = existPlayerData.losePoints;
        placeholderJoin.playerStatsOgs = existPlayerData.ogs;
        placeholderJoin.playerStatsTotal = existPlayerData.totals;
        placeholderJoin.playerStatsWins = existPlayerData.wins;
        placeholderJoin.playerStatsRating = existPlayerData.rating;
        placeholderJoin.playerStatsDisconns = existPlayerData.disconns;

        if (player.name != existPlayerData.name) {
            // if this player changed his/her name
            // notify that fact to other players only once ( it will never be notified if he/she rejoined next time)
            placeholderJoin.playerNameOld = existPlayerData.name
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.changename, placeholderJoin), null, 0x00FF00, "normal", 0);
        }

        // check anti-rejoin flood when this option is enabled
        if (window.gameRoom.config.settings.antiJoinFlood === true) { //FIXME: Connection Closed Message is shown when anti-rejoin flooding kick (FIND the reason why)
            if (joinTimeStamp - existPlayerData.leftDate <= window.gameRoom.config.settings.joinFloodIntervalMillisecs) { // when rejoin flood
                if (existPlayerData.rejoinCount > window.gameRoom.config.settings.joinFloodAllowLimitation) {
                    // kick this player
                    window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for anti-rejoin flood. (origin:${player.name}#${player.id},conn:${player.conn})`);
                    window.gameRoom._room.kickPlayer(player.id, LangRes.antitrolling.joinFlood.banReason, false); // kick
                    //and add into ban list (not permanent ban, but fixed-term ban)
                    await setBanlistDataToDB({ conn: player.conn, reason: LangRes.antitrolling.joinFlood.banReason, register: joinTimeStamp, expire: joinTimeStamp + window.gameRoom.config.settings.joinFloodBanMillisecs })
                    return; // exit from this join event
                } else { //just warn
                    window.gameRoom._room.sendAnnouncement(LangRes.antitrolling.joinFlood.floodWarning, player.id, 0xFF0000, "bold", 2);
                    window.gameRoom.playerList.get(player.id)!.entrytime.rejoinCount++; // and add count
                }
            } else {
                // init rejoin count
                window.gameRoom.playerList.get(player.id)!.entrytime.rejoinCount = 0;
            }
        }

    } else {
        // if new player
        // create a Player Object
        window.gameRoom.playerList.set(player.id, new Player(player, {
            rating: 1000,
            totals: 0,
            disconns: 0,
            wins: 0,
            goals: 0,
            assists: 0,
            ogs: 0,
            losePoints: 0,
            balltouch: 0,
            passed: 0
        }, {
            mute: false,
            muteExpire: 0,
            afkmode: false,
            afkreason: '',
            afkdate: 0,
            malActCount: 0,
            superadmin: false,
            lastPowershotUse: 0
        }, {
            rejoinCount: 0,
            joinDate: joinTimeStamp,
            leftDate: 0,
            matchEntryTime: 0
        }));
    }

    await setPlayerDataToDB(convertToPlayerStorage(window.gameRoom.playerList.get(player.id)!)); // register(or update) this player into DB

    if (window.gameRoom.config.rules.autoAdmin === true) { // if auto admin option is enabled
        updateAdmins(); // check there are any admin players, if not make an admin player.
    }

    if (window.gameRoom.config.settings.avatarOverridingByTier === true) {
        // if avatar overrding option is enabled
        const playerTierForAvatar = decideTier(window.gameRoom.playerList.get(player.id)!.stats.rating, player.id);
        window.gameRoom._room.setPlayerAvatar(player.id, getAvatarByTier(playerTierForAvatar, player.id));
    }

    // send welcome message to new player with delays
    const playerData = window.gameRoom.playerList.get(player.id)!;
    const playerTier = decideTier(playerData.stats.rating, player.id);
    const tierName = getTierName(playerTier, player.id);
    const tierColor = getTierColor(playerTier);
    const adminIndicator = player.admin ? '⭐' : '';
    const superAdminIndicator = playerData.permissions.superadmin ? '👑' : '';
    
    // Select random ASCII banner from strings and send immediately
    const randomIndex = Math.floor(Math.random() * LangRes.welcomeSystem.asciiWelcomeBanners.length);
    const asciiWelcome = LangRes.welcomeSystem.asciiWelcomeBanners[randomIndex];
    window.gameRoom._room.sendAnnouncement(asciiWelcome, player.id, 0x00FFFF, "normal", 0);
    
    // Player stats calculations
    const winRate = playerData.stats.totals > 0 ? Math.round((playerData.stats.wins / playerData.stats.totals) * 100) : 0;
    const goalsPerGame = playerData.stats.totals > 0 ? (playerData.stats.goals / playerData.stats.totals).toFixed(1) : '0.0';
    const assistsPerGame = playerData.stats.totals > 0 ? (playerData.stats.assists / playerData.stats.totals).toFixed(1) : '0.0';
    
    // Motivational message based on tier
    let motivationalMsg = '';
    switch(playerTier) {
        case Tier.TierNew:
            const remainingMatches = window.gameRoom.config.HElo.factor.placement_match_chances - playerData.stats.totals;
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tierNew.replace('{remainingMatches}', remainingMatches.toString());
            break;
        case Tier.Tier1:
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier1;
            break;
        case Tier.Tier2:
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier2;
            break;
        case Tier.Tier3:
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier3;
            break;
        case Tier.Tier4:
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier4;
            break;
        case Tier.Tier5:
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier5;
            break;
        case Tier.Tier6:
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier6;
            break;
        case Tier.Tier7:
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier7;
            break;
        case Tier.Challenger:
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.challenger;
            break;
        default:
            if(playerTier >= Tier.Tier8 && playerTier <= Tier.Tier27) {
                const rank = playerTier - Tier.Tier8 + 1;
                motivationalMsg = LangRes.welcomeSystem.motivationalMessages.topRanked.replace('{rank}', rank.toString());
            } else {
                motivationalMsg = LangRes.welcomeSystem.motivationalMessages.default;
            }
    }
    
    // Send welcome messages with delays
    
    setTimeout(() => {
        const welcomeMsg = `🎉 ¡Bienvenido ${player.name}! Prepárate para la acción ⚽`;
        window.gameRoom._room.sendAnnouncement(welcomeMsg, player.id, 0x00FF88, "bold", 0);
    }, 1000);
    
    setTimeout(() => {
        const playerInfo = `👤 ${superAdminIndicator}${adminIndicator}${player.name}#${player.id} | ${tierName} | ELO: ${playerData.stats.rating}`;
        const statsHeader = `📊 Estas son tus estadísticas actuales: ${playerInfo}`;
        window.gameRoom._room.sendAnnouncement(statsHeader, player.id, tierColor, "bold", 0);
    }, 2000);
    
    setTimeout(() => {
        const statsInfo = `⚽ Partidos: ${playerData.stats.totals} | Victorias: ${playerData.stats.wins} (${winRate}%) | Goles: ${playerData.stats.goals} (${goalsPerGame}/partido) | Asistencias: ${playerData.stats.assists} (${assistsPerGame}/partido)`;
        window.gameRoom._room.sendAnnouncement(statsInfo, player.id, 0x00AA00, "normal", 0);
    }, 4000);
    
    setTimeout(() => {
        window.gameRoom._room.sendAnnouncement(motivationalMsg, player.id, 0xFF69B4, "normal", 0);
    }, 5000);
    
    setTimeout(() => {
        const commandsInfo = `🎮 Comandos esenciales: !help !stats !ranking !afk !discord`;
        window.gameRoom._room.sendAnnouncement(commandsInfo, player.id, 0x00BFFF, "normal", 0);
    }, 9000);
    
    setTimeout(() => {
        const discordInfo = `💬 ¡Únete a nuestra comunidad en Discord! Conoce otros jugadores, participa en torneos y mantente al día con las novedades: https://discord.gg/qfg45B2`;
        window.gameRoom._room.sendAnnouncement(discordInfo, player.id, 0x7289DA, "normal", 0);
    }, 13000);

    // send notice
    if(window.gameRoom.notice !== '') {
        window.gameRoom._room.sendAnnouncement(window.gameRoom.notice, player.id, 0x55AADD, "bold", 0);
    }

    // check number of players joined and change game mode
    let activePlayersNumber: number = roomActivePlayersNumberCheck();
    if (window.gameRoom.config.rules.statsRecord === true && activePlayersNumber >= window.gameRoom.config.rules.requisite.minimumPlayers) {
        if (window.gameRoom.isStatRecord === false) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.startRecord, placeholderJoin), null, 0x00FF00, "normal", 0);
            window.gameRoom.isStatRecord = true;
            if (window.gameRoom.config.rules.autoOperating === true && window.gameRoom.isGamingNow === true) {
                // if auto emcee mode is enabled and the match has been playing as ready mode
                window.gameRoom._room.stopGame(); // stop game
            }
        }
    } else {
        if (window.gameRoom.isStatRecord === true) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.stopRecord, placeholderJoin), null, 0x00FF00, "normal", 0);
            window.gameRoom.isStatRecord = false;
        }
    }

    // when auto emcee mode is enabled
    if (window.gameRoom.config.rules.autoOperating === true) {
        setTimeout(() => {
            // Siempre asignar a equipos balanceados, independientemente del estado del juego
            assignPlayerToBalancedTeam(player.id);
            
            // Solo iniciar juego automáticamente si no hay partida en curso
            if (window.gameRoom._room.getScores() === null) {
                setTimeout(() => {
                    const teamsInfo = getTeamsEloInfo();
                    
                    window.gameRoom.logger.i('onPlayerJoin', `Current teams after assignment - Red: ${teamsInfo.redCount}, Blue: ${teamsInfo.blueCount}`);
                    
                    // Iniciar juego si hay al menos 1 jugador por equipo
                    if (teamsInfo.redCount > 0 && teamsInfo.blueCount > 0) {
                        setDefaultStadiums();
                        setTimeout(() => {
                            window.gameRoom._room.startGame();
                            window.gameRoom.logger.i('onPlayerJoin', `Game started automatically (Red: ${teamsInfo.redCount}, Blue: ${teamsInfo.blueCount})`);
                        }, 500);
                    }
                }, 500);
            } else {
                window.gameRoom.logger.i('onPlayerJoin', `Player ${player.id} assigned to balanced team - game in progress`);
            }
        }, 500);
    }

    // emit websocket event
    window._emitSIOPlayerInOutEvent(player.id);
}
