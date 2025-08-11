import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { updateAdmins, setDefaultStadiums } from "../RoomTools";
import { getUnixTimestamp } from "../Statistics";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { recuritByOne, roomActivePlayersNumberCheck, roomTeamPlayersNumberCheck, balanceTeamsAfterLeave, forceTeamBalance } from "../../model/OperateHelper/Quorum";
import { QueueSystem } from "../../model/OperateHelper/QueueSystem";
import { convertToPlayerStorage, getBanlistDataFromDB, setBanlistDataToDB, setPlayerDataToDB } from "../Storage";

export async function onPlayerLeaveListener(player: PlayerObject): Promise<void> {
    // Event called when a player leaves the room.
    let leftTimeStamp: number = getUnixTimestamp();

    if (window.gameRoom.playerList.has(player.id) == false) { // if the player wasn't registered in playerList
        return; // exit this event
    }

    var placeholderLeft = { 
        playerID: player.id,
        playerName: player.name,
        playerStatsRating: window.gameRoom.playerList.get(player.id)!.stats.rating,
        playerStatsTotal: window.gameRoom.playerList.get(player.id)!.stats.totals,
        playerStatsDisconns: window.gameRoom.playerList.get(player.id)!.stats.disconns,
        playerStatsWins: window.gameRoom.playerList.get(player.id)!.stats.wins,
        playerStatsGoals: window.gameRoom.playerList.get(player.id)!.stats.goals,
        playerStatsAssists: window.gameRoom.playerList.get(player.id)!.stats.assists,
        playerStatsOgs: window.gameRoom.playerList.get(player.id)!.stats.ogs,
        playerStatsLosepoints: window.gameRoom.playerList.get(player.id)!.stats.losePoints,
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count
    };

    window.gameRoom.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);

    // Remove player from queue if they're in it
    const queueSystemRemove = QueueSystem.getInstance();
    queueSystemRemove.removePlayerFromQueue(player.id);

    // Reset powershot if the leaving player was the powershot holder
    if (window.gameRoom.ballStack.getPowershotPlayer() === player.id) {
        window.gameRoom.ballStack.resetPowershot();
        window.gameRoom.logger.i('powershot', `🔄 Powershot reset - player ${player.name}#${player.id} left`);
    }

    // check number of players joined and change game mode
    let activePlayersNumber: number = roomActivePlayersNumberCheck();
    if (window.gameRoom.config.rules.statsRecord === true && activePlayersNumber >= window.gameRoom.config.rules.requisite.minimumPlayers) {
        if (window.gameRoom.isStatRecord === false) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onLeft.startRecord, placeholderLeft), null, 0x00FF00, "normal", 0);
            window.gameRoom.isStatRecord = true;
            setDefaultStadiums(); // Cambiar al mapa de estadísticas cuando hay suficientes jugadores
        }
        // when auto emcee mode is enabled
        if(window.gameRoom.config.rules.autoOperating === true && window.gameRoom.isGamingNow === true) {
            if(player.team !== TeamID.Spec) {
                // Usar el nuevo sistema de balanceo mejorado con delay mayor
                setTimeout(() => {
                    balanceTeamsAfterLeave();
                    window.gameRoom.logger.i('onPlayerLeave', `Player ${player.name}#${player.id} left from ${player.team === TeamID.Red ? 'Red' : 'Blue'} team, attempting balance`);
                }, 600); // Delay aumentado para asegurar procesamiento completo
            }
        }
    } else {
        if (window.gameRoom.isStatRecord === true) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onLeft.stopRecord, placeholderLeft), null, 0x00FF00, "normal", 0);
            window.gameRoom.isStatRecord = false;
            setDefaultStadiums(); // Cambiar al mapa ready/training cuando no hay suficientes jugadores
            // when auto emcee mode is enabled and lack of players
            if(window.gameRoom.config.rules.autoOperating === true && window.gameRoom.isGamingNow === true) {
                window.gameRoom._room.stopGame(); // stop for start readymode game
                window.gameRoom.winningStreak = { // init
                    count: 0,
                    teamID: 0
                };
            } 
        }
    }

    if(window.gameRoom.isGamingNow === true && window.gameRoom.isStatRecord === true && window.gameRoom.playerList.get(player.id)!.team !== TeamID.Spec) {
        // if this player is disconnected (include abscond)
        window.gameRoom.playerList.get(player.id)!.stats.disconns++;
        placeholderLeft.playerStatsDisconns = window.gameRoom.playerList.get(player.id)!.stats.disconns;
        
        // PENALIZACIONES POR ABANDONO DESHABILITADAS - No más sanciones por salir de partida
        /*if(window.gameRoom.config.settings.antiGameAbscond === true) { // if anti abscond option is enabled
            window.gameRoom.playerList.get(player.id)!.stats.rating -= window.gameRoom.config.settings.gameAbscondRatingPenalty; // rating penalty
            if(await getBanlistDataFromDB(window.gameRoom.playerList.get(player.id)!.conn) === undefined ) { // if this player is in match(team player), fixed-term ban this player
                // check this player already registered in ban list to prevent overwriting other ban reason.
                window.gameRoom.logger.i('onPlayerLeave', `${player.name}#${player.id} has been added in fixed term ban list for abscond.`);
                await setBanlistDataToDB({ conn: window.gameRoom.playerList.get(player.id)!.conn, reason: LangRes.antitrolling.gameAbscond.banReason, register: leftTimeStamp, expire: leftTimeStamp + window.gameRoom.config.settings.gameAbscondBanMillisecs });
            }
        }*/
        
        window.gameRoom.logger.i('onPlayerLeave', `${player.name}#${player.id} left during game - no penalties applied`);
    }

    if (window.gameRoom.config.settings.banVoteEnable) { // check vote and reduce
        if(window.gameRoom.playerList.has(window.gameRoom.playerList.get(player.id)!.voteTarget)) {
            window.gameRoom.playerList.get(window.gameRoom.playerList.get(player.id)!.voteTarget)!.voteGet -= 1;
        }
    }

    window.gameRoom.playerList.get(player.id)!.entrytime.leftDate = leftTimeStamp; // save left time
    await setPlayerDataToDB(convertToPlayerStorage(window.gameRoom.playerList.get(player.id)!)); // save
    window.gameRoom.playerList.delete(player.id); // delete from player list

    if(window.gameRoom.config.rules.autoAdmin === true) { // if auto admin option is enabled
        updateAdmins(); // update admin
    }

    // Process queue if there are now available spots
    const queueSystem = QueueSystem.getInstance();
    if (queueSystem.shouldQueueBeActive()) {
        queueSystem.processQueue();
    } else {
        queueSystem.deactivateQueue();
    }

    // emit websocket event
    window._emitSIOPlayerInOutEvent(player.id);
}
