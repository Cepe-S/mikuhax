import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { getUnixTimestamp } from "../Statistics";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { roomTeamPlayersNumberCheck, getTeamsEloInfo } from "../../model/OperateHelper/Quorum";
import { decideTier, getAvatarByTier, Tier } from "../../model/Statistics/Tier";
import { setBanlistDataToDB } from "../Storage";
import { getRandomMatch } from "../../resource/realTeams";
import { qDetector } from "../QDetector";
import { HElo, MatchResult, StatsRecord } from "../../model/Statistics/HElo";
import { EloIntegrityTracker } from "../../model/Statistics/EloIntegrityTracker";

export function onGameStartListener(byPlayer: PlayerObject | null): void {
    // Reiniciar almacenamiento temporal de eventos de partido
    window.gameRoom.matchEventsHolder = [];
    
    // Reset del uso del comando !size para todos los jugadores al inicio del partido
    window.gameRoom.playerList.forEach((player) => {
        (player as any).sizeUsedThisMatch = false;
    });
    
    // Reset del detector de "q" al inicio del partido
    qDetector.reset();
    
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
    
    // Initialize ELO integrity tracking for this match
    if (window.gameRoom.config.rules.statsRecord === true && window.gameRoom.isStatRecord === true) {
        const eloTracker = EloIntegrityTracker.getInstance();
        eloTracker.onMatchStart();
    }

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

        // NO mezclar equipos durante el juego - solo mostrar información
        if (window.gameRoom.config.rules.autoOperating === true) {
            // Solo mostrar información de equipos sin mezclar
            const teamsInfo = getTeamsEloInfo();
            
            // Mostrar información de ELO de equipos
            const redEloMsg = `🔴 Equipo Rojo: ${teamsInfo.redCount} jugadores | ELO Total: ${teamsInfo.redElo} | Promedio: ${teamsInfo.redCount > 0 ? Math.round(teamsInfo.redElo / teamsInfo.redCount) : 0}`;
            const blueEloMsg = `🔵 Equipo Azul: ${teamsInfo.blueCount} jugadores | ELO Total: ${teamsInfo.blueElo} | Promedio: ${teamsInfo.blueCount > 0 ? Math.round(teamsInfo.blueElo / teamsInfo.blueCount) : 0}`;
            const balanceMsg = `⚖️ Diferencia de ELO: ${Math.abs(teamsInfo.redElo - teamsInfo.blueElo)} puntos`;
            
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onStart.startRecord, placeholderStart), null, 0x00FF00, "normal", 0);
            window.gameRoom._room.sendAnnouncement(redEloMsg, null, 0xFD2C2D, "normal", 0);
            window.gameRoom._room.sendAnnouncement(blueEloMsg, null, 0x18fde8, "normal", 0);
            window.gameRoom._room.sendAnnouncement(balanceMsg, null, 0xFFFF00, "normal", 0);
            
            // Mostrar predicciones de ELO individuales
            showEloExpectations();
        } else {
            // Modo manual - solo mostrar información de equipos
            const teamsInfo = getTeamsEloInfo();
            const redEloMsg = `🔴 Equipo Rojo: ${teamsInfo.redCount} jugadores | ELO Total: ${teamsInfo.redElo} | Promedio: ${teamsInfo.redCount > 0 ? Math.round(teamsInfo.redElo / teamsInfo.redCount) : 0}`;
            const blueEloMsg = `🔵 Equipo Azul: ${teamsInfo.blueCount} jugadores | ELO Total: ${teamsInfo.blueElo} | Promedio: ${teamsInfo.blueCount > 0 ? Math.round(teamsInfo.blueElo / teamsInfo.blueCount) : 0}`;
            
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onStart.startRecord, placeholderStart), null, 0x00FF00, "normal", 0);
            window.gameRoom._room.sendAnnouncement(redEloMsg, null, 0xFD2C2D, "normal", 0);
            window.gameRoom._room.sendAnnouncement(blueEloMsg, null, 0x18fde8, "normal", 0);
            
            // Mostrar predicciones de ELO individuales
            showEloExpectations();
        }

        // Auto-pause removed - game starts immediately
    } else {
        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onStart.stopRecord, placeholderStart), null, 0x00FF00, "normal", 0);
    }

    // Cambiar camisetas de equipos
    const match = getRandomMatch();
    if (match) {
        window.gameRoom._room.setTeamColors(TeamID.Red, match.red.angle, match.red.textColour, [match.red.teamColour1, match.red.teamColour2, match.red.teamColour3]);
        window.gameRoom._room.setTeamColors(TeamID.Blue, match.blue.angle, match.blue.textColour, [match.blue.teamColour1, match.blue.teamColour2, match.blue.teamColour3]);
        
        // Mostrar nombres de equipos en el chat
        window.gameRoom._room.sendAnnouncement(`⚽ ${match.red.name} vs ${match.blue.name}`, null, 0xFFFFFF, "bold", 1);
    }

    // replay record start
    window.gameRoom._room.startRecording();

    // Initialize powershot system for new game with current settings
    window.gameRoom.ballStack.initPowershotSystem();

    window.gameRoom.logger.i('onGameStart', msg);
}

function showEloExpectations(): void {
    const ratingHelper: HElo = HElo.getInstance();
    
    let allActivePlayers: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false);
    let teamPlayers: PlayerObject[] = allActivePlayers.filter((eachPlayer: PlayerObject) => eachPlayer.team !== TeamID.Spec);
    let redTeamPlayers: PlayerObject[] = teamPlayers.filter((eachPlayer: PlayerObject) => eachPlayer.team === TeamID.Red);
    let blueTeamPlayers: PlayerObject[] = teamPlayers.filter((eachPlayer: PlayerObject) => eachPlayer.team === TeamID.Blue);
    
    if (redTeamPlayers.length === 0 || blueTeamPlayers.length === 0) return;
    
    // Calcular promedios de equipos
    let redTeamRatingsMean: number = ratingHelper.calcTeamRatingsMean(redTeamPlayers);
    let blueTeamRatingsMean: number = ratingHelper.calcTeamRatingsMean(blueTeamPlayers);
    
    // Crear registros simulados para predicciones
    let redStatsRecordsWin: StatsRecord[] = ratingHelper.makeStasRecord(MatchResult.Win, redTeamPlayers);
    let blueStatsRecordsWin: StatsRecord[] = ratingHelper.makeStasRecord(MatchResult.Win, blueTeamPlayers);
    let redStatsRecordsLose: StatsRecord[] = ratingHelper.makeStasRecord(MatchResult.Lose, redTeamPlayers);
    let blueStatsRecordsLose: StatsRecord[] = ratingHelper.makeStasRecord(MatchResult.Lose, blueTeamPlayers);
    
    // Calcular y mostrar expectativas para cada jugador
    setTimeout(() => {
        // Jugadores del equipo rojo
        redStatsRecordsWin.forEach((eachItem: StatsRecord, idx: number) => {
            let diffArrayWin: number[] = [];
            let diffArrayLose: number[] = [];
            let playerTotals: number = window.gameRoom.playerList.get(redTeamPlayers[idx].id)!.stats.totals;
            
            // Calcular cambios si gana
            for (let i: number = 0; i < blueStatsRecordsLose.length; i++) {
                diffArrayWin.push(ratingHelper.calcBothDiff(eachItem, blueStatsRecordsLose[i], redTeamRatingsMean, blueTeamRatingsMean, eachItem.matchKFactor, playerTotals));
            }
            
            // Calcular cambios si pierde
            for (let i: number = 0; i < blueStatsRecordsWin.length; i++) {
                diffArrayLose.push(ratingHelper.calcBothDiff(redStatsRecordsLose[idx], blueStatsRecordsWin[i], blueTeamRatingsMean, redTeamRatingsMean, redStatsRecordsLose[idx].matchKFactor, playerTotals));
            }
            
            let winChange = Math.round(diffArrayWin.reduce((acc, curr) => acc + curr, 0));
            let loseChange = Math.round(diffArrayLose.reduce((acc, curr) => acc + curr, 0));
            
            let expectationMsg = `📊 Expectativas ELO:\n🏆 Si ganas: +${winChange} puntos\n💔 Si pierdes: ${loseChange} puntos`;
            window.gameRoom._room.sendAnnouncement(expectationMsg, redTeamPlayers[idx].id, 0xFFD700, "normal", 1);
        });
        
        // Jugadores del equipo azul
        blueStatsRecordsWin.forEach((eachItem: StatsRecord, idx: number) => {
            let diffArrayWin: number[] = [];
            let diffArrayLose: number[] = [];
            let playerTotals: number = window.gameRoom.playerList.get(blueTeamPlayers[idx].id)!.stats.totals;
            
            // Calcular cambios si gana
            for (let i: number = 0; i < redStatsRecordsLose.length; i++) {
                diffArrayWin.push(ratingHelper.calcBothDiff(eachItem, redStatsRecordsLose[i], blueTeamRatingsMean, redTeamRatingsMean, eachItem.matchKFactor, playerTotals));
            }
            
            // Calcular cambios si pierde
            for (let i: number = 0; i < redStatsRecordsWin.length; i++) {
                diffArrayLose.push(ratingHelper.calcBothDiff(blueStatsRecordsLose[idx], redStatsRecordsWin[i], redTeamRatingsMean, blueTeamRatingsMean, blueStatsRecordsLose[idx].matchKFactor, playerTotals));
            }
            
            let winChange = Math.round(diffArrayWin.reduce((acc, curr) => acc + curr, 0));
            let loseChange = Math.round(diffArrayLose.reduce((acc, curr) => acc + curr, 0));
            
            let expectationMsg = `📊 Expectativas ELO:\n🏆 Si ganas: +${winChange} puntos\n💔 Si pierdes: ${loseChange} puntos`;
            window.gameRoom._room.sendAnnouncement(expectationMsg, blueTeamPlayers[idx].id, 0xFFD700, "normal", 1);
        });
    }, 1000);
}
