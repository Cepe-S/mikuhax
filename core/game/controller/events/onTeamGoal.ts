import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { MatchEvent } from "../../model/GameObject/MatchEvent";
import { MatchEventHolder } from "../../model/GameObject/MatchEventHolder";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { ScoresObject } from "../../model/GameObject/ScoresObject";
import { setBanlistDataToDB } from "../Storage";
import { getUnixTimestamp } from "../Statistics";

// ========================================
// MENSAJES PERSONALIZADOS PARA GOLES
// ========================================

/**
 * Genera un mensaje aleatorio para goles normales
 */
function getRandomScorerMessage(playerName: string): string {
    const scorerMessages = [
        "⚽ ¡Golazo de " + playerName + "!",
        "🔥 ¡Impresionante remate de " + playerName + "!",
        "💥⚽ ¡Espectacular gol de " + playerName + "!",
        "💥😱 ¡Increíble golazo de " + playerName + "!",
        "👌 ¡Bien definido por " + playerName + "!",
        "La definición de " + playerName + " definitivamente es cine! 🍷🚬 ",
        "¡Golazo de " + playerName + " que está jugando desnudo! 🔞",
        "🔥 Eduque " + playerName + ", eduque 👏 ",
        "🥵 ¡Golazo de " + playerName + ", que definió a lo Czerro! 👑🐐",
        "Cuando sos crack, sos crack... ¡Y " + playerName + " lo acaba de demostrar! 💪🔥",
        "⚡ ¡Golazo total de " + playerName + "! 🚀",
        "🍾 ¡HaxBall Champagne! " + playerName + " acaba de marcar un golazo ⚽🔥",
        "🤩 ¡Naa, golazo de " + playerName + "! 😱",
        "🎯 ¡99 de definición, " + playerName + " lo acaba de demostrar! 🔥",
        "💥⚽ ¡Ufff, qué golazo de " + playerName + "! 😱",
        "😱 ¡Locura de gol de " + playerName + "! 🥵",
        "👀 ¡Olfato de gol! " + playerName + " lo ha hecho otra vez! ⚽"
    ];
    
    return scorerMessages[Math.floor(Math.random() * scorerMessages.length)];
}

/**
 * Genera un mensaje aleatorio para asistencias
 */
function getRandomAssistMessage(assistPlayerName: string): string {
    const assistMessages = [
        "👟 ¡Gran pase de " + assistPlayerName + "!",
        "🎯 ¡Preciso pase de " + assistPlayerName + "!",
        "🔑 ¡La jugada se gestó con una asistencia de " + assistPlayerName + "!",
        "🤝 ¡" + assistPlayerName + " brinda la asistencia para el gol!",
        "⚽ ¡Asistencia perfecta de " + assistPlayerName + "!",
        "👌 ¡Excelente pase de " + assistPlayerName + "!",
        "🔥 ¡Jugada brillante de " + assistPlayerName + "!",
        "🤩 ¡" + assistPlayerName + " crea la oportunidad de gol!",
        "👏 ¡Fantástica asistencia de " + assistPlayerName + "!",
        "💫 ¡" + assistPlayerName + " demuestra su visión de juego!",
    ];
    
    return assistMessages[Math.floor(Math.random() * assistMessages.length)];
}

/**
 * Genera un mensaje aleatorio para asistencias (versión corta)
 */
function getRandomAssistMessage2(assistPlayerName: string): string {
    const assistMessages2 = [
        "⚽👟 ¡**ASISTENCIA** de **" + assistPlayerName + "**!",
        "👥⚽ ¡**PASE** de **" + assistPlayerName + "**!"
    ];
    
    return assistMessages2[Math.floor(Math.random() * assistMessages2.length)];
}

/**
 * Genera un mensaje aleatorio para autogoles
 */
function getRandomOwnGoalScorerMessage(playerName: string): string {
    const ownGoalScorerMessages = [
        "⚠️ ¡Qué desastre! " + playerName + " anotó un gol en contra.",
        "🔥 ¡Increíble! " + playerName + " marcó en su propia meta.",
        "🙈 ¡Vaya error! " + playerName + " hizo gol en propia meta.",
        "💣 ¡Gol en propia puerta! " + playerName + " cometió un autogol.",
        "😱 ¡Autogol involuntario! " + playerName + " no pudo evitarlo.",
        "😫 ¡Qué mala suerte! " + playerName + " anotó en su propia portería.",
        "💥 ¡Increíble autogol! " + playerName + " se equivocó en la definición.",
        "😖 ¡Inesperado gol en propia meta! " + playerName + " desvió el balón al arco equivocado.",
        "🚫 ¡Desviación desafortunada! " + playerName + " desvía el balón a su propia red.",
        "💔 ¡Golpe desafortunado! " + playerName + " termina marcando en su propia meta.",
        "😩 ¡Autogol desafortunado! " + playerName + " no puede evitar el error.",
        "💢 ¡Terrible autogol! " + playerName + " comete un grave error.",
        "😵 ¡Autogol sorprendente! " + playerName + " no puede creer lo que acaba de hacer.",
        "😓 ¡Autogol desastroso! " + playerName + " se lamenta por su propia anotación.",
        "⛔️ ¡Autogol trágico! " + playerName + " sufre un duro golpe en su equipo.",
        "🤯 ¡Autogol catastrófico! " + playerName + " vive una pesadilla en el campo.",
    ];
    
    return ownGoalScorerMessages[Math.floor(Math.random() * ownGoalScorerMessages.length)];
}

export async function onTeamGoalListener(team: TeamID): Promise<void> {
    // Event called when a team scores a goal.
    let scores: ScoresObject | null = window.gameRoom._room.getScores(); //get scores object (it includes time data about seconds elapsed)
    window.gameRoom.logger.i('onTeamGoal', `Goal time logger (secs):${Math.round(scores?.time || 0)}`);

    var placeholderGoal = { 
        teamID: team,
        teamName: '',
        scorerID: 0,
        scorerName: '',
        assistID: 0,
        assistName: '',
        ogID: 0,
        ogName: '',
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count

    };

    if (team === TeamID.Red) {
        // if red team win
        placeholderGoal.teamName = 'Red';
    } else {
        // if blue team win
        placeholderGoal.teamName = 'Blue';
    }
    // identify who has goaled.
    var touchPlayer: number | undefined = window.gameRoom.ballStack.pop();
    var assistPlayer: number | undefined = window.gameRoom.ballStack.pop();
    window.gameRoom.ballStack.clear(); // clear the stack.
    window.gameRoom.ballStack.initTouchInfo(); // clear touch info
    var matchTime = Math.round(scores?.time || 0); // get match time
    if (window.gameRoom.isStatRecord == true && touchPlayer !== undefined) { // records when game mode is for stats recording.
        // except spectators and filter who were lose a point
        var losePlayers: PlayerObject[] = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.team !== TeamID.Spec && player.team !== team);
        losePlayers.forEach(function (eachPlayer: PlayerObject) {
            // records a lost point in match record
            window.gameRoom.playerList.get(eachPlayer.id)!.matchRecord.losePoints++;
            //setPlayerData(window.playerList.get(eachPlayer.id)!); // updates lost points count
        });

        // check whether or not it is an OG. and process it!
        if (window.gameRoom.playerList.get(touchPlayer)!.team === team) { // if the goal is normal goal (not OG)
            placeholderGoal.scorerID = window.gameRoom.playerList.get(touchPlayer)!.id;
            placeholderGoal.scorerName = window.gameRoom.playerList.get(touchPlayer)!.name;
            window.gameRoom.playerList.get(touchPlayer)!.matchRecord.goals++; // record goal in match record
            const goalEvent: MatchEventHolder = {
                type: 'goal',
                playerAuth: window.gameRoom.playerList.get(touchPlayer)!.auth,
                playerTeamId: team,
                matchTime: matchTime
            };
            
            if (assistPlayer !== undefined && touchPlayer != assistPlayer && window.gameRoom.playerList.get(assistPlayer)!.team === team) {
                goalEvent.assistPlayerAuth = window.gameRoom.playerList.get(assistPlayer)!.auth;
            }
            
            window.gameRoom.matchEventsHolder.push(goalEvent);
            
            // Generar mensaje personalizado de gol
            var goalMsg: string = getRandomScorerMessage(window.gameRoom.playerList.get(touchPlayer)!.name);
            
            if (assistPlayer !== undefined && touchPlayer != assistPlayer && window.gameRoom.playerList.get(assistPlayer)!.team === team) {
                // records assist when the player who assists is not same as the player goaled, and is not other team.
                placeholderGoal.assistID = window.gameRoom.playerList.get(assistPlayer)!.id;
                placeholderGoal.assistName = window.gameRoom.playerList.get(assistPlayer)!.name;
                window.gameRoom.playerList.get(assistPlayer)!.matchRecord.assists++; // record assist in match record
                window.gameRoom.matchEventsHolder.push({
                    type: 'assist',
                    playerAuth: window.gameRoom.playerList.get(assistPlayer)!.auth,
                    playerTeamId: team,
                    matchTime: matchTime
                });
                
                // Combinar mensaje de gol + asistencia
                const assistMsg = getRandomAssistMessage(window.gameRoom.playerList.get(assistPlayer)!.name);
                goalMsg = goalMsg + "\n" + assistMsg;
            }
            
            window.gameRoom._room.sendAnnouncement(goalMsg, null, 0x00FF00, "normal", 0);
            window.gameRoom.logger.i('onTeamGoal', goalMsg);
        } else { // if the goal is OG
            placeholderGoal.ogID = touchPlayer;
            placeholderGoal.ogName = window.gameRoom.playerList.get(touchPlayer)!.name;
            window.gameRoom.playerList.get(touchPlayer)!.matchRecord.ogs++; // record OG in match record
            
            // Usar mensaje personalizado de autogol
            const ownGoalMsg = getRandomOwnGoalScorerMessage(window.gameRoom.playerList.get(touchPlayer)!.name);
            window.gameRoom._room.sendAnnouncement(ownGoalMsg, null, 0xFF6666, "normal", 0);
            window.gameRoom.logger.i('onTeamGoal', `${window.gameRoom.playerList.get(touchPlayer)!.name}#${touchPlayer} made an OG: ${ownGoalMsg}`);
            
            window.gameRoom.matchEventsHolder.push({
                type: 'ownGoal',
                playerAuth: window.gameRoom.playerList.get(touchPlayer)!.auth,
                playerTeamId: window.gameRoom.playerList.get(touchPlayer)!.team,
                matchTime: matchTime
            });
            if(window.gameRoom.config.settings.antiOgFlood === true) { // if anti-OG flood option is enabled
                window.gameRoom.antiTrollingOgFloodCount.push(touchPlayer); // record it
                
                let ogCountByPlayer: number = 0;
                window.gameRoom.antiTrollingOgFloodCount.forEach((record) =>  { //check how many times OG made by this player
                    if(record === touchPlayer) {
                        ogCountByPlayer++; //count
                    }
                });

                if(ogCountByPlayer >= window.gameRoom.config.settings.ogFloodCriterion) { // if too many OGs were made
                    // kick this player
                    const banTimeStamp: number = getUnixTimestamp(); // get current timestamp
                    window.gameRoom.logger.i('onTeamGoal', `${window.gameRoom.playerList.get(touchPlayer)!.name}#${touchPlayer} was kicked for anti-OGs flood. He made ${ogCountByPlayer} OGs. (conn:${window.gameRoom.playerList.get(touchPlayer)!.conn})`);
                    window.gameRoom._room.kickPlayer(touchPlayer, LangRes.antitrolling.ogFlood.banReason, false); // kick
                    //and add into ban list (not permanent ban, but fixed-term ban)
                    await setBanlistDataToDB({ conn: window.gameRoom.playerList.get(touchPlayer)!.conn, reason: LangRes.antitrolling.ogFlood.banReason, register: banTimeStamp, expire: banTimeStamp+window.gameRoom.config.settings.ogFloodBanMillisecs });
                }
            }
            
        }
    }
}
