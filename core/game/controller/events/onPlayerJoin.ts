import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { Player } from "../../model/GameObject/Player";
import { convertToPlayerStorage, getBanlistDataFromDB, getPlayerDataFromDB, removeBanlistDataFromDB, setBanlistDataToDB, setPlayerDataToDB, getBanByAuthFromDB, getMuteByAuthFromDB, removeBanByAuthFromDB, removeMuteByAuthFromDB } from "../Storage";
import { getUnixTimestamp } from "../Statistics";
import { setDefaultStadiums, updateAdmins } from "../RoomTools";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { roomActivePlayersNumberCheck, roomTeamPlayersNumberCheck, assignPlayerToBalancedTeam, getTeamsEloInfo } from "../../model/OperateHelper/Quorum";
import { QueueSystem } from "../../model/OperateHelper/QueueSystem";
import { decideTier, getAvatarByTier, getTierName, getTierColor, Tier } from "../../model/Statistics/Tier";
import { isExistNickname, isIncludeBannedWords } from "../TextFilter";
import { trackPlayerConnection } from "../ConnectionTracker";
import { trackPlayerConnectionLocal } from "../LocalConnectionTracker";

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

    // check ban list (new auth-based system)
    let playerBanChecking = await getBanByAuthFromDB(player.auth);
    if (!playerBanChecking) {
        // Fallback to old conn-based system for compatibility
        playerBanChecking = await getBanlistDataFromDB(player.conn);
    }
    
    if (playerBanChecking !== undefined) {// if banned (bListCheck would had returned string or boolean)
        placeholderJoin.banListReason = playerBanChecking.reason;

        if (playerBanChecking.expire == -1) { // Permanent ban
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in permanent ban list. (auth:${player.auth},reason:${playerBanChecking.reason})`);
            window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.permanentBan, placeholderJoin), false); // auto kick
            return;
        }
        if (playerBanChecking.expire > joinTimeStamp) { // Fixed-term ban (time limited ban)
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for registered in fixed-term ban list. (auth:${player.auth},reason:${playerBanChecking.reason})`);
            window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.banList.fixedTermBan, placeholderJoin), false); // auto kick
            return;
        }
        if (playerBanChecking.expire != -1 && playerBanChecking.expire <= joinTimeStamp) { // time-over from expiration date
            // ban clear for this player
            window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} is deleted from the ban list because the date has expired. (auth:${player.auth},reason:${playerBanChecking.reason})`);
            
            // Clear from both auth-based and conn-based systems
            try {
                await removeBanByAuthFromDB(player.auth);
            } catch (e) {
                window.gameRoom.logger.w('onPlayerJoin', `Failed to remove auth-based ban for ${player.auth}: ${e}`);
            }
            
            try {
                await removeBanlistDataFromDB(player.conn);
            } catch (e) {
                // Ignore if old ban doesn't exist
            }
            
            // Clear from Haxball's native system as well
            try {
                window.gameRoom._room.clearBan(player.id);
                window.gameRoom.logger.i('onPlayerJoin', `Cleared native ban for ${player.name}#${player.id}`);
            } catch (e) {
                // Ignore if player wasn't banned in native system
            }
        }
    }

    // Check mute status (auth-based system)
    let muteStatus = { mute: false, muteExpire: 0 };
    try {
        const playerMuteChecking = await getMuteByAuthFromDB(player.auth);
        if (playerMuteChecking !== undefined) {
            if (playerMuteChecking.expire === -1) {
                // Permanent mute
                muteStatus.mute = true;
                muteStatus.muteExpire = -1;
                window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} has permanent mute. (auth:${player.auth},reason:${playerMuteChecking.reason})`);
            } else if (playerMuteChecking.expire > joinTimeStamp) {
                // Active mute
                muteStatus.mute = true;
                muteStatus.muteExpire = playerMuteChecking.expire;
                window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} is muted until ${new Date(playerMuteChecking.expire)}. (auth:${player.auth},reason:${playerMuteChecking.reason})`);
            } else if (playerMuteChecking.expire !== -1 && playerMuteChecking.expire <= joinTimeStamp) {
                // Expired mute - remove it
                window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} mute has expired and was removed. (auth:${player.auth},reason:${playerMuteChecking.reason})`);
                await removeMuteByAuthFromDB(player.auth);
            }
        }
    } catch (error) {
        window.gameRoom.logger.w('onPlayerJoin', `Error checking mute status for ${player.name}: ${error}`);
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
            mute: muteStatus.mute,
            muteExpire: muteStatus.muteExpire,
            afkmode: false,
            afkreason: '',
            afkdate: 0,
            malActCount: existPlayerData.malActCount,
            superadmin: false,
            lastPowershotUse: 0,
            lastActivityTime: joinTimeStamp
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
        if (window.gameRoom.config.settings.antiJoinFlood === true) {
            const timeSinceLastLeft = joinTimeStamp - existPlayerData.leftDate;
            const isQuickRejoin = timeSinceLastLeft <= window.gameRoom.config.settings.joinFloodIntervalMillisecs && existPlayerData.leftDate > 0;
            
            if (isQuickRejoin) {
                // Increment rejoin count for quick rejoins
                window.gameRoom.playerList.get(player.id)!.entrytime.rejoinCount = existPlayerData.rejoinCount + 1;
                
                // Only kick if exceeding the limit AND it's been less than the interval AND player has actually left before
                if (existPlayerData.rejoinCount >= window.gameRoom.config.settings.joinFloodAllowLimitation && existPlayerData.leftDate > 0) {
                    window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} kicked for excessive rejoining: ${existPlayerData.rejoinCount + 1} rejoins in ${Math.floor(timeSinceLastLeft/1000)}s`);
                    window.gameRoom._room.kickPlayer(player.id, "🚫 Reconexiones frecuentes (5 minutos).", false);
                    
                    // Add to ban list with reduced time
                    try {
                        await window._createBanDB(
                            window.gameRoom.config._RUID,
                            player.auth,
                            player.conn,
                            "🚫 Reconexiones frecuentes (5 minutos).",
                            5, // 5 minutes ban
                            'system',
                            'Anti-flood System',
                            player.name
                        );
                    } catch (error) {
                        window.gameRoom.logger.w('onPlayerJoin', `Failed to create ban record: ${error}`);
                    }
                    return;
                } else if (existPlayerData.rejoinCount >= Math.floor(window.gameRoom.config.settings.joinFloodAllowLimitation / 2) && existPlayerData.leftDate > 0) {
                    // Warn when approaching limit
                    window.gameRoom._room.sendAnnouncement("⚠️ Evita reconectarte muy seguido o serás baneado temporalmente.", player.id, 0xFF0000, "bold", 2);
                }
            } else {
                // Reset rejoin count if enough time has passed or if it's first join
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
            mute: muteStatus.mute,
            muteExpire: muteStatus.muteExpire,
            afkmode: false,
            afkreason: '',
            afkdate: 0,
            malActCount: 0,
            superadmin: false,
            lastPowershotUse: 0,
            lastActivityTime: joinTimeStamp
        }, {
            rejoinCount: 0,
            joinDate: joinTimeStamp,
            leftDate: 0,
            matchEntryTime: 0
        }));
    }

    await setPlayerDataToDB(convertToPlayerStorage(window.gameRoom.playerList.get(player.id)!)); // register(or update) this player into DB

    // Track player connection for anti-spam analysis (HTTP version - DISABLED for performance)
    // trackPlayerConnection(player).catch(err => {
    //     window.gameRoom.logger.w('onPlayerJoin', `Failed to track connection for ${player.name}: ${err.message}`);
    // });

    // Track player connection locally (no HTTP issues)
    trackPlayerConnectionLocal(player);

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
        const playerInfo = `👤 ${superAdminIndicator}${adminIndicator}${player.name}#${player.id} | ${tierName} | ELO: ${Math.round(playerData.stats.rating)}`;
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
            setDefaultStadiums(); // Cambiar al mapa de estadísticas cuando hay suficientes jugadores
            
            // Rebalancear todos los jugadores cuando se cambia a modo estadísticas
            if (window.gameRoom.config.rules.autoOperating === true) {
                const queueSystem = QueueSystem.getInstance();
                const allPlayers = window.gameRoom._room.getPlayerList().filter((p: PlayerObject) => p.id !== 0 && window.gameRoom.playerList.has(p.id) && !window.gameRoom.playerList.get(p.id)!.permissions.afkmode);
                
                // Mover todos a espectadores primero
                allPlayers.forEach((p: PlayerObject) => {
                    window.gameRoom._room.setPlayerTeam(p.id, TeamID.Spec);
                });
                
                // Verificar si cola debe estar activa antes de asignar equipos (sin delay)
                if (queueSystem.shouldQueueBeActive()) {
                    queueSystem.activateQueue();
                    queueSystem.processQueue();
                    window.gameRoom.logger.i('onPlayerJoin', 'Used queue system for team assignment when switching to stats mode');
                } else {
                    // Asignar a equipos balanceados usando método normal inmediatamente
                    allPlayers.forEach((p: PlayerObject) => {
                        assignPlayerToBalancedTeam(p.id);
                    });
                    window.gameRoom.logger.i('onPlayerJoin', 'Used normal team assignment when switching to stats mode');
                }
            }
            
            if (window.gameRoom.config.rules.autoOperating === true && window.gameRoom.isGamingNow === true) {
                // if auto emcee mode is enabled and the match has been playing as ready mode
                window.gameRoom._room.stopGame(); // stop game
            }
        }
    } else {
        if (window.gameRoom.isStatRecord === true) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onJoin.stopRecord, placeholderJoin), null, 0x00FF00, "normal", 0);
            window.gameRoom.isStatRecord = false;
            setDefaultStadiums(); // Cambiar al mapa ready/training cuando no hay suficientes jugadores
        }
    }

    // when auto emcee mode is enabled
    if (window.gameRoom.config.rules.autoOperating === true) {
        // Lógica diferente para asignación de equipos según el modo
        if (window.gameRoom.isStatRecord === false) {
            // Modo ready/training: verificar si cola debe estar activa primero
            const queueSystem = QueueSystem.getInstance();
            if (queueSystem.shouldQueueBeActive()) {
                queueSystem.activateQueue();
                queueSystem.addPlayerToQueue(player.id);
                window.gameRoom.logger.i('onPlayerJoin', `Player ${player.id} added to queue in ready mode`);
            } else {
                // Si no hay cola, asignar al equipo rojo por defecto para que pueda jugar
                window.gameRoom._room.setPlayerTeam(player.id, TeamID.Red);
                window.gameRoom.logger.i('onPlayerJoin', `Player ${player.id} assigned to Red team in ready mode`);
            }
        } else {
            // Modo estadísticas: asignar al equipo con menos jugadores
            const currentPlayers = window.gameRoom._room.getPlayerList().filter(p => p.id !== 0 && p.id !== player.id);
            const redCount = currentPlayers.filter(p => p.team === TeamID.Red).length;
            const blueCount = currentPlayers.filter(p => p.team === TeamID.Blue).length;
            
            const targetTeam = redCount <= blueCount ? TeamID.Red : TeamID.Blue;
            window.gameRoom._room.setPlayerTeam(player.id, targetTeam);
            window.gameRoom.logger.i('onPlayerJoin', `Player ${player.id} assigned to ${targetTeam === TeamID.Red ? 'Red' : 'Blue'} team`);
        }
            
        // Solo iniciar juego automáticamente si no hay partida en curso
        if (window.gameRoom._room.getScores() === null) {
            const teamsInfo = getTeamsEloInfo();
            
            window.gameRoom.logger.i('onPlayerJoin', `Current teams after assignment - Red: ${teamsInfo.redCount}, Blue: ${teamsInfo.blueCount}`);
            
            // Lógica diferente según el modo del juego
            if (window.gameRoom.isStatRecord === false) {
                // Modo ready/training: iniciar juego inmediatamente
                window.gameRoom._room.startGame();
                window.gameRoom.logger.i('onPlayerJoin', `Game started immediately in ready mode (Red: ${teamsInfo.redCount}, Blue: ${teamsInfo.blueCount})`);
            } else {
                // Modo estadísticas: solo iniciar si hay al menos 1 jugador por equipo
                if (teamsInfo.redCount > 0 && teamsInfo.blueCount > 0) {
                    window.gameRoom._room.startGame();
                    window.gameRoom.logger.i('onPlayerJoin', `Game started immediately in stats mode (Red: ${teamsInfo.redCount}, Blue: ${teamsInfo.blueCount})`);
                } else {
                    window.gameRoom.logger.i('onPlayerJoin', `Game not started - insufficient balanced teams for stats mode (Red: ${teamsInfo.redCount}, Blue: ${teamsInfo.blueCount})`);
                }
            }
        } else {
            window.gameRoom.logger.i('onPlayerJoin', `Player ${player.id} assigned to team - game in progress`);
        }

    }

    // emit websocket event
    window._emitSIOPlayerInOutEvent(player.id);
}
