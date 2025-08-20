import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { ScoresObject } from "../../model/GameObject/ScoresObject";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { shuffleArray } from "../RoomTools";
import { fetchActiveSpecPlayers, roomActivePlayersNumberCheck, assignPlayerToBalancedTeam } from "../../model/OperateHelper/Quorum";
import { QueueSystem } from "../../model/OperateHelper/QueueSystem";
import { HElo, MatchResult, StatsRecord } from "../../model/Statistics/HElo";
import { convertToPlayerStorage, setPlayerDataToDB, setMatchEventDataToDB, setMatchSummaryDataToDB } from "../Storage";
import { getUnixTimestamp } from "../Statistics";
import { MatchEvent } from "../../model/GameObject/MatchEvent";
import { set } from "node-persist";
import { MatchSummary } from "../../model/GameObject/MatchSummary";
import { updateTop20Cache } from "../../model/Statistics/Tier";

export async function onTeamVictoryListener(scores: ScoresObject): Promise<void> {
    // Event called when a team 'wins'. not just when game ended.
    // records vicotry in stats. total games also counted in this event.
    // Haxball developer Basro said, The game will be stopped automatically after a team victory. (victory -> stop)
    let placeholderVictory = {
        teamID: TeamID.Spec,
        teamName: '',
        redScore: scores.red,
        blueScore: scores.blue,
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count
    };

    let ratingHelper: HElo = HElo.getInstance(); // get HElo instance for calc rating

    let winningMessage: string = '';

    // Use initial teams for ELO calculation but current teams for win/loss determination
    const { EloIntegrityTracker } = require('../../model/Statistics/EloIntegrityTracker');
    const eloTracker = EloIntegrityTracker.getInstance();
    const playersAtStart = eloTracker.getPlayersAtMatchStart();
    
    let allActivePlayers: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => 
        player.id !== 0 && 
        window.gameRoom.playerList.get(player.id)!.permissions.afkmode === false &&
        playersAtStart.has(player.id)
    );
    
    // For ELO calculation: use initial teams
    let initialRedTeamPlayers: PlayerObject[] = allActivePlayers.filter((player: PlayerObject) => 
        eloTracker.getInitialTeam(player.id) === TeamID.Red
    );
    let initialBlueTeamPlayers: PlayerObject[] = allActivePlayers.filter((player: PlayerObject) => 
        eloTracker.getInitialTeam(player.id) === TeamID.Blue
    );
    
    let teamPlayers: PlayerObject[] = [...initialRedTeamPlayers, ...initialBlueTeamPlayers];

    let winnerTeamID: TeamID;
    let loserTeamID: TeamID;

    if (scores.red > scores.blue) {
        winnerTeamID = TeamID.Red;
        loserTeamID = TeamID.Blue;
        placeholderVictory.teamName = 'Red';
    } else {
        winnerTeamID = TeamID.Blue;
        loserTeamID = TeamID.Red;
        placeholderVictory.teamName = 'Blue';
    }
    placeholderVictory.teamID = winnerTeamID;
    winningMessage = Tst.maketext(LangRes.onVictory.victory, placeholderVictory);

    window.gameRoom.isGamingNow = false; // turn off

    // Variable para almacenar cambios de ELO
    let eloChanges: Array<{playerId: number, playerName: string, oldRating: number, newRating: number, change: number, isWinner: boolean}> = [];

    if (window.gameRoom.config.rules.statsRecord == true && window.gameRoom.isStatRecord == true) { // records when game mode is for stats recording.
        // HElo rating part ================
        // make diffs array (key: index by teamPlayers order, value: number[])


        // make stat records using initial teams for ratings but final teams for win/loss
        let redStatsRecords: StatsRecord[] = [];
        let blueStatsRecords: StatsRecord[] = [];
        
        // Create records for initial red team players
        initialRedTeamPlayers.forEach((player: PlayerObject) => {
            const isWinner = player.team === winnerTeamID; // Use current team for win/loss
            redStatsRecords.push({
                rating: window.gameRoom.playerList.get(player.id)!.stats.rating,
                realResult: isWinner ? MatchResult.Win : MatchResult.Lose,
                matchKFactor: window.gameRoom.playerList.get(player.id)!.matchRecord.factorK,
                matchGoal: window.gameRoom.playerList.get(player.id)!.matchRecord.goals,
                matchOG: window.gameRoom.playerList.get(player.id)!.matchRecord.ogs,
                matchPassSuccRate: (
                    window.gameRoom.playerList.get(player.id)!.matchRecord.balltouch === 0
                    ? 0
                    : parseFloat((window.gameRoom.playerList.get(player.id)!.matchRecord.passed / window.gameRoom.playerList.get(player.id)!.matchRecord.balltouch).toFixed(2))
                )
            });
        });
        
        // Create records for initial blue team players
        initialBlueTeamPlayers.forEach((player: PlayerObject) => {
            const isWinner = player.team === winnerTeamID; // Use current team for win/loss
            blueStatsRecords.push({
                rating: window.gameRoom.playerList.get(player.id)!.stats.rating,
                realResult: isWinner ? MatchResult.Win : MatchResult.Lose,
                matchKFactor: window.gameRoom.playerList.get(player.id)!.matchRecord.factorK,
                matchGoal: window.gameRoom.playerList.get(player.id)!.matchRecord.goals,
                matchOG: window.gameRoom.playerList.get(player.id)!.matchRecord.ogs,
                matchPassSuccRate: (
                    window.gameRoom.playerList.get(player.id)!.matchRecord.balltouch === 0
                    ? 0
                    : parseFloat((window.gameRoom.playerList.get(player.id)!.matchRecord.passed / window.gameRoom.playerList.get(player.id)!.matchRecord.balltouch).toFixed(2))
                )
            });
        });

        // calc average of initial team ratings
        let winTeamRatingsMean: number = ratingHelper.calcTeamRatingsMean(initialRedTeamPlayers);
        let loseTeamRatingsMean: number = ratingHelper.calcTeamRatingsMean(initialBlueTeamPlayers);

        // get diff and update rating
        redStatsRecords.forEach((eachItem: StatsRecord, idx: number) => {
            let diffArray: number[] = [];
            let oldRating: number = window.gameRoom.playerList.get(initialRedTeamPlayers[idx].id)!.stats.rating;
            let playerTotals: number = window.gameRoom.playerList.get(initialRedTeamPlayers[idx].id)!.stats.totals;
            for (let i: number = 0; i < blueStatsRecords.length; i++) {
                diffArray.push(ratingHelper.calcBothDiff(eachItem, blueStatsRecords[i], winTeamRatingsMean, loseTeamRatingsMean, eachItem.matchKFactor, playerTotals));
            }
            let newRating: number = ratingHelper.calcNewRatingWithActivityBonus(eachItem.rating, diffArray, playerTotals);
            let eloChange: number = newRating - oldRating;
            
            window.gameRoom.playerList.get(initialRedTeamPlayers[idx].id)!.stats.rating = newRating;
            
            eloChanges.push({
                playerId: initialRedTeamPlayers[idx].id,
                playerName: initialRedTeamPlayers[idx].name,
                oldRating: oldRating,
                newRating: newRating,
                change: eloChange,
                isWinner: initialRedTeamPlayers[idx].team === winnerTeamID
            });
        });
        blueStatsRecords.forEach((eachItem: StatsRecord, idx: number) => {
            let diffArray: number[] = [];
            let oldRating: number = window.gameRoom.playerList.get(initialBlueTeamPlayers[idx].id)!.stats.rating;
            let playerTotals: number = window.gameRoom.playerList.get(initialBlueTeamPlayers[idx].id)!.stats.totals;
            for (let i: number = 0; i < redStatsRecords.length; i++) {
                diffArray.push(ratingHelper.calcBothDiff(eachItem, redStatsRecords[i], winTeamRatingsMean, loseTeamRatingsMean, eachItem.matchKFactor, playerTotals));
            }
            let newRating: number = ratingHelper.calcNewRatingWithActivityBonus(eachItem.rating, diffArray, playerTotals);
            let eloChange: number = newRating - oldRating;
            
            window.gameRoom.playerList.get(initialBlueTeamPlayers[idx].id)!.stats.rating = newRating;
            
            eloChanges.push({
                playerId: initialBlueTeamPlayers[idx].id,
                playerName: initialBlueTeamPlayers[idx].name,
                oldRating: oldRating,
                newRating: newRating,
                change: eloChange,
                isWinner: initialBlueTeamPlayers[idx].team === winnerTeamID
            });
        });

        // record stats part ================
        teamPlayers.forEach(async (eachPlayer: PlayerObject) => {
            if (eachPlayer.team === winnerTeamID) { // if this player's current team won
                window.gameRoom.playerList.get(eachPlayer.id)!.stats.wins++; //records a win
            }
            window.gameRoom.playerList.get(eachPlayer.id)!.stats.totals++; // records game count and other stats
            window.gameRoom.playerList.get(eachPlayer.id)!.stats.goals += window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.goals;
            window.gameRoom.playerList.get(eachPlayer.id)!.stats.assists += window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.assists;
            window.gameRoom.playerList.get(eachPlayer.id)!.stats.ogs += window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.ogs;
            window.gameRoom.playerList.get(eachPlayer.id)!.stats.losePoints += window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.losePoints;
            window.gameRoom.playerList.get(eachPlayer.id)!.stats.balltouch += window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.balltouch;
            window.gameRoom.playerList.get(eachPlayer.id)!.stats.passed += window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.passed;

            window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord = { // init match record
                goals: 0,
                assists: 0,
                ogs: 0,
                losePoints: 0,
                balltouch: 0,
                passed: 0,
                factorK: window.gameRoom.config.HElo.factor.factor_k_normal
            }

            await setPlayerDataToDB(convertToPlayerStorage(window.gameRoom.playerList.get(eachPlayer.id)!)); // updates stats
        });

        // win streak part ================
        if (winnerTeamID !== window.gameRoom.winningStreak.teamID) {
            // if winner team is changed
            window.gameRoom.winningStreak.count = 1; // init count and set to won one game
        } else {
            window.gameRoom.winningStreak.count++; // increase count
        }
        window.gameRoom.winningStreak.teamID = winnerTeamID; // set winner team id

        // update placeholder
        placeholderVictory.streakTeamName = convertTeamID2Name(window.gameRoom.winningStreak.teamID);
        placeholderVictory.streakTeamCount = window.gameRoom.winningStreak.count;

        window.gameRoom.logger.i('onTeamVictory', `${placeholderVictory.streakTeamName} team wins streak ${placeholderVictory.streakTeamCount} games.`); // log it

        if (window.gameRoom.winningStreak.count >= 3) {
            winningMessage += '\n' + Tst.maketext(LangRes.onVictory.burning, placeholderVictory);
        }

        const matchId = `${window.gameRoom.config._RUID}_${getUnixTimestamp()}`; // Unique match ID: RUID_timestamp

        // save matchEvents
        window.gameRoom.matchEventsHolder.forEach(holder => {
            // sets the matchEvent
            const matchEvent = {
                eventType: holder.type,
                playerAuth: holder.playerAuth,
                playerTeamId: holder.playerTeamId,
                matchId: matchId,
                matchTime: holder.matchTime,
                timestamp: getUnixTimestamp()
            } as MatchEvent;
            setMatchEventDataToDB(matchEvent).catch((err: Error) => {
                window.gameRoom.logger.e('onTeamVictory', `Error saving match event: ${err.message}`);
            });
        });

        const matchSummary = {
            matchId: matchId,
            totalMatchTime: window.gameRoom.config.rules.requisite.timeLimit,
            team1Players: initialRedTeamPlayers.map(player => window.gameRoom.playerList.get(player.id)!.auth),
            team2Players: initialBlueTeamPlayers.map(player => window.gameRoom.playerList.get(player.id)!.auth),
            serverRuid: window.gameRoom.config._RUID,
            timestamp: getUnixTimestamp()
        } as MatchSummary;
        setMatchSummaryDataToDB(matchSummary).catch((err: Error) => {
            window.gameRoom.logger.e('onTeamVictory', `Error saving match summary: ${err.message}`);
        });
    }

    // when auto emcee mode is enabled
    if (window.gameRoom.config.rules.autoOperating === true) {
        if (window.gameRoom.winningStreak.count >= window.gameRoom.config.settings.rerollWinstreakCriterion) {
            // if winning streak count has reached limit
            if (window.gameRoom.config.settings.rerollWinStreak === true && roomActivePlayersNumberCheck() >= window.gameRoom.config.rules.requisite.minimumPlayers) {
                // if rerolling option is enabled, then reroll randomly

                window.gameRoom.winningStreak.count = 0; // init count

                const queueSystem = QueueSystem.getInstance();
                
                // Check if queue system should be active
                if (queueSystem.shouldQueueBeActive()) {
                    window.gameRoom.logger.i('onTeamVictory', 'Reroll needed but queue system should be active - using queue instead');
                    
                    // Move all players to spectators first
                    let allPlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList();
                    allPlayersList.forEach((eachPlayer: PlayerObject) => {
                        if (eachPlayer.id !== 0) {
                            window.gameRoom._room.setPlayerTeam(eachPlayer.id, TeamID.Spec);
                        }
                    });
                    
                    // Activate queue and process it
                    queueSystem.activateQueue();
                    setTimeout(() => {
                        queueSystem.processQueue();
                        window.gameRoom.logger.i('onTeamVictory', 'Queue system handled reroll scenario');
                    }, 100);
                } else {
                    // Original reroll behavior when queue is not needed
                    window.gameRoom.logger.i('onTeamVictory', 'Performing traditional reroll - queue not needed');
                    
                    // get new active players list and shuffle it randomly
                    let allPlayersList: PlayerObject[] = window.gameRoom._room.getPlayerList();
                    let shuffledIDList: number[] = shuffleArray(allPlayersList
                        .filter((eachPlayer: PlayerObject) => eachPlayer.id !== 0 && window.gameRoom.playerList.get(eachPlayer.id)!.permissions.afkmode === false)
                        .map((eachPlayer: PlayerObject) => eachPlayer.id)
                    );

                    allPlayersList.forEach((eachPlayer: PlayerObject) => {
                        window.gameRoom._room.setPlayerTeam(eachPlayer.id, TeamID.Spec); // move all to spec
                    });

                    for (let i: number = 0; i < shuffledIDList.length; i++) {
                        if (i < window.gameRoom.config.rules.requisite.eachTeamPlayers) window.gameRoom._room.setPlayerTeam(shuffledIDList[i], TeamID.Red);
                        if (i >= window.gameRoom.config.rules.requisite.eachTeamPlayers && i < window.gameRoom.config.rules.requisite.eachTeamPlayers * 2) window.gameRoom._room.setPlayerTeam(shuffledIDList[i], TeamID.Blue);
                    }
                    
                    window.gameRoom.logger.i('onTeamVictory', `Whole players are shuffled. (${shuffledIDList.toString()})`);
                }

                winningMessage += '\n' + Tst.maketext(LangRes.onVictory.reroll, placeholderVictory);
            }
        } else { // or still under the limit, then change spec and loser team
            const queueSystem = QueueSystem.getInstance();
            
            window.gameRoom.logger.i('onTeamVictory', `Processing team victory: Winner=${winnerTeamID === TeamID.Red ? 'Red' : 'Blue'}, Loser=${loserTeamID === TeamID.Red ? 'Red' : 'Blue'}`);
            
            // Check if queue system should be active
            if (queueSystem.shouldQueueBeActive()) {
                queueSystem.activateQueue();
                
                window.gameRoom.logger.i('onTeamVictory', 'Queue system is active - adding losing team to queue');
                
                // Add losing team to queue in random positions
                queueSystem.addLosingTeamToQueue(loserTeamID);
                
                // Process queue to fill available spots - this will only assign the right number of players
                setTimeout(() => {
                    window.gameRoom.logger.i('onTeamVictory', 'Processing queue after team victory');
                    queueSystem.processQueue();
                    queueSystem.debugStatus();
                }, 100); // Small delay to ensure teams are properly set up
            } else {
                window.gameRoom.logger.i('onTeamVictory', 'Queue system not active - using original behavior');
                // Original behavior when queue is not needed
                // Mover perdedores a espectadores (respetando tiempo de juego garantizado)
                window.gameRoom._room.getPlayerList()
                    .filter((player: PlayerObject) => player.team === loserTeamID)
                    .forEach((player: PlayerObject) => {
                        if (window.gameRoom.config.settings.guaranteePlayingTime === false || (scores.time - window.gameRoom.playerList.get(player.id)!.entrytime.matchEntryTime) > window.gameRoom.config.settings.guaranteedPlayingTimeSeconds) {
                            window.gameRoom._room.setPlayerTeam(player.id, TeamID.Spec); // just move all losers to Spec team
                        }
                    });

                // Usar el nuevo sistema de balance para rellenar equipos
                const specPlayers: PlayerObject[] = fetchActiveSpecPlayers();
                const currentLosers = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.team === loserTeamID);
                const needToFill = window.gameRoom.config.rules.requisite.eachTeamPlayers - currentLosers.length;
                
                // Asignar jugadores de espectadores al equipo perdedor usando balance inteligente
                for(let i = 0; i < needToFill && i < specPlayers.length; i++) {
                    // Forzar al equipo perdedor para mantener el juego
                    window.gameRoom._room.setPlayerTeam(specPlayers[i].id, loserTeamID);
                    window.gameRoom.logger.i('onTeamVictory', `Player ${specPlayers[i].id} assigned to losing team ${loserTeamID} to continue game`);
                }
                
                // Si quedan más espectadores, balancear entre ambos equipos
                const remainingSpecs = fetchActiveSpecPlayers();
                for(let i = 0; i < remainingSpecs.length; i++) {
                    assignPlayerToBalancedTeam(remainingSpecs[i].id);
                }
            }
        }
    }

    // notify victory
    window.gameRoom.logger.i('onTeamVictory', `The game has ended. Scores ${scores.red}:${scores.blue}.`);
    window.gameRoom._room.sendAnnouncement(winningMessage, null, 0x00FF00, "bold", 1);
    
    // Show individual ELO changes if stats were recorded
    if (window.gameRoom.config.rules.statsRecord == true && window.gameRoom.isStatRecord == true && typeof eloChanges !== 'undefined') {
        setTimeout(() => {
            // Enviar mensaje individual a cada jugador
            eloChanges.forEach(player => {
                const changeStr = player.change >= 0 ? `+${Math.round(player.change)}` : `${Math.round(player.change)}`;
                const resultIcon = player.isWinner ? "🏆" : "💔";
                const resultText = player.isWinner ? "GANASTE" : "PERDISTE";
                
                let personalMsg = `${resultIcon} ${resultText}\n📊 Tu cambio de ELO: ${Math.round(player.oldRating)} → ${Math.round(player.newRating)} (${changeStr})`;
                
                const color = player.isWinner ? 0x00FF88 : 0xFF6666;
                window.gameRoom._room.sendAnnouncement(personalMsg, player.playerId, color, "bold", 1);
            });
        }, 2000);
    }
    
    // Clear ELO violations for next match
    if (window.gameRoom.config.rules.statsRecord == true && window.gameRoom.isStatRecord == true) {
        setTimeout(() => {
            eloTracker.clearViolations();
        }, 4000);
    }
    
    // Update TOP 20 cache after match completion
    setTimeout(() => {
        updateTop20Cache();
    }, 5000); // Wait a bit longer to ensure all ELO changes are processed
}
