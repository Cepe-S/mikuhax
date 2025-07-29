import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { getUnixTimestamp } from "../Statistics";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { roomTeamPlayersNumberCheck, shuffleTeamsByElo, getTeamsEloInfo } from "../../model/OperateHelper/Quorum";
import { decideTier, getAvatarByTier, Tier } from "../../model/Statistics/Tier";
import { setBanlistDataToDB } from "../Storage";

export function onGameStartListener(byPlayer: PlayerObject | null): void {
    // Reiniciar almacenamiento temporal de eventos de partido
    window.gameRoom.matchEventsHolder = [];
    /* Event called when a game starts.
        byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    let placeholderStart = {
        playerID: 0,
        playerName: '',
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count
    };

    let allPlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList(); // all list

    window.gameRoom.isGamingNow = true; // turn on

    if (window.gameRoom.config.settings.antiChatFlood === true) { // if anti-chat flood option is enabled
        window.gameRoom.antiTrollingChatFloodCount = []; // clear and init again
    }
    if (window.gameRoom.config.settings.antiOgFlood === true) { // if anti-OG flood option is enabled
        window.gameRoom.antiTrollingOgFloodCount = []; // clear and init again
    }

    let msg = `The game(stat record:${window.gameRoom.isStatRecord}) has been started.`;
    if (byPlayer !== null && byPlayer.id !== 0) {
        placeholderStart.playerID = byPlayer.id;
        placeholderStart.playerName = byPlayer.name;
        msg += `(by ${byPlayer.name}#${byPlayer.id})`;
    }

    if(window.gameRoom.config.settings.avatarOverridingByTier === true) {
        // if avatar overrding option is enabled
        allPlayersList.forEach((eachPlayer: PlayerObject) => {
            const playerTier = decideTier(window.gameRoom.playerList.get(eachPlayer.id)!.stats.rating, eachPlayer.id);
            window.gameRoom._room.setPlayerAvatar(eachPlayer.id, getAvatarByTier(playerTier, eachPlayer.id)); 
        });
    }

    if (window.gameRoom.config.rules.statsRecord === true && window.gameRoom.isStatRecord === true) { // if the game mode is stats, records the result of this game.
        //requisite check for anti admin's abusing (eg. prevent game playing)
        if (window.gameRoom.config.settings.antiInsufficientStartAbusing === true && byPlayer !== null) {
            if (roomTeamPlayersNumberCheck(TeamID.Red) < window.gameRoom.config.rules.requisite.eachTeamPlayers || roomTeamPlayersNumberCheck(TeamID.Blue) < window.gameRoom.config.rules.requisite.eachTeamPlayers) {
                let abusingID: number = byPlayer.id || 0;
                let abusingTimestamp: number = getUnixTimestamp();
                window.gameRoom.logger.i('onGameStart', `The game will be stopped because of insufficient players in each team.`);
                window.gameRoom.antiInsufficientStartAbusingCount.push(abusingID);
                window.gameRoom._room.stopGame();
                window.gameRoom._room.sendAnnouncement(LangRes.antitrolling.insufficientStartAbusing.abusingWarning, null, 0xFF0000, "bold", 2);

                if (abusingID !== 0 && window.gameRoom.antiInsufficientStartAbusingCount.filter(eachID => eachID === abusingID).length > window.gameRoom.config.settings.insufficientStartAllowLimitation) {
                    //if limitation has over then fixed-term ban that admin player
                    setBanlistDataToDB({ conn: window.gameRoom.playerList.get(abusingID)!.conn, reason: LangRes.antitrolling.insufficientStartAbusing.banReason, register: abusingTimestamp, expire: abusingTimestamp + window.gameRoom.config.settings.insufficientStartAbusingBanMillisecs });
                    window.gameRoom._room.kickPlayer(abusingID, LangRes.antitrolling.insufficientStartAbusing.banReason, false);     
                }
                
                return; // abort this event.
            } else {
                window.gameRoom.antiInsufficientStartAbusingCount = []; // clear and init
            }
        }

        allPlayersList
                .filter((eachPlayer: PlayerObject) => eachPlayer.team !== TeamID.Spec)
                .forEach((eachPlayer: PlayerObject) => { 
                    window.gameRoom.playerList.get(eachPlayer.id)!.entrytime.matchEntryTime = 0; // init each player's entry match time
                    if(window.gameRoom.playerList.get(eachPlayer.id)!.stats.totals < 10) {
                        window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.factorK = window.gameRoom.config.HElo.factor.factor_k_placement; // set K Factor as a Placement match
                    } // or default value is Normal match
                });

        // Mezclar equipos por ELO antes de iniciar
        if (window.gameRoom.config.rules.autoOperating === true) {
            shuffleTeamsByElo();
            
            // Esperar un momento para que se complete el shuffle
            setTimeout(() => {
                const teamsInfo = getTeamsEloInfo();
                
                // Mostrar información de ELO de equipos en lugar de expectativas
                const redEloMsg = `🔴 Equipo Rojo: ${teamsInfo.redCount} jugadores | ELO Total: ${teamsInfo.redElo} | Promedio: ${teamsInfo.redCount > 0 ? Math.round(teamsInfo.redElo / teamsInfo.redCount) : 0}`;
                const blueEloMsg = `🔵 Equipo Azul: ${teamsInfo.blueCount} jugadores | ELO Total: ${teamsInfo.blueElo} | Promedio: ${teamsInfo.blueCount > 0 ? Math.round(teamsInfo.blueElo / teamsInfo.blueCount) : 0}`;
                const balanceMsg = `⚖️ Diferencia de ELO: ${Math.abs(teamsInfo.redElo - teamsInfo.blueElo)} puntos`;
                
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onStart.startRecord, placeholderStart), null, 0x00FF00, "normal", 0);
                window.gameRoom._room.sendAnnouncement(redEloMsg, null, 0xFF3333, "normal", 0);
                window.gameRoom._room.sendAnnouncement(blueEloMsg, null, 0x3399FF, "normal", 0);
                window.gameRoom._room.sendAnnouncement(balanceMsg, null, 0xFFFF00, "normal", 0);
            }, 200);
        } else {
            // Modo manual - solo mostrar información de equipos
            const teamsInfo = getTeamsEloInfo();
            const redEloMsg = `🔴 Equipo Rojo: ${teamsInfo.redCount} jugadores | ELO Total: ${teamsInfo.redElo} | Promedio: ${teamsInfo.redCount > 0 ? Math.round(teamsInfo.redElo / teamsInfo.redCount) : 0}`;
            const blueEloMsg = `🔵 Equipo Azul: ${teamsInfo.blueCount} jugadores | ELO Total: ${teamsInfo.blueElo} | Promedio: ${teamsInfo.blueCount > 0 ? Math.round(teamsInfo.blueElo / teamsInfo.blueCount) : 0}`;
            
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onStart.startRecord, placeholderStart), null, 0x00FF00, "normal", 0);
            window.gameRoom._room.sendAnnouncement(redEloMsg, null, 0xFF3333, "normal", 0);
            window.gameRoom._room.sendAnnouncement(blueEloMsg, null, 0x3399FF, "normal", 0);
        }

        if(window.gameRoom.config.rules.autoOperating === true) { // if game rule is set as auto operating mode
            // Pausar después del shuffle para dar tiempo a que se vean los equipos
            setTimeout(() => {
                window.gameRoom._room.pauseGame(true); // pause (and will call onGamePause event)
            }, 500);
        }
    } else {
        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onStart.stopRecord, placeholderStart), null, 0x00FF00, "normal", 0);
    }

    // replay record start
    window.gameRoom._room.startRecording();

    // Initialize powershot system for new game
    window.gameRoom.ballStack.resetPowershot();

    window.gameRoom.logger.i('onGameStart', msg);
}
