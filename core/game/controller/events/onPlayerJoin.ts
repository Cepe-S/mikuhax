import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { Player } from "../../model/GameObject/Player";
import { getUnixTimestamp } from "../Statistics";
import { setDefaultStadiums, updateAdmins } from "../RoomTools";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";

export async function onPlayerJoinListener(player: PlayerObject): Promise<void> {
    const joinTimeStamp: number = getUnixTimestamp();

    window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} has joined. CONN(${player.conn}),AUTH(${player.auth})`);

    var placeholderJoin = {
        playerID: player.id,
        playerName: player.name,
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count
    };

    // Simple separator check
    if (player.name.includes('|,|')) {
        window.gameRoom.logger.i('onPlayerJoin', `${player.name}#${player.id} was joined but kicked for including separator word. (|,|)`);
        window.gameRoom._room.kickPlayer(player.id, Tst.maketext(LangRes.onJoin.includeSeperator, placeholderJoin), false);
        return;
    }

    // Create simple player object
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
        muteExpire: -1,
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

    if (window.gameRoom.config.rules.autoAdmin === true) {
        updateAdmins();
    }

    // Welcome system with ASCII art and motivational messages
    setTimeout(() => {
        // ASCII Welcome Banner
        const asciiArt = LangRes.welcomeSystem.asciiWelcomeBanners[0];
        window.gameRoom._room.sendAnnouncement(asciiArt, player.id, 0x00AAFF, "small", 0);
        
        // Welcome message
        const welcomeMsg = Tst.maketext(LangRes.onJoin.welcome, placeholderJoin);
        window.gameRoom._room.sendAnnouncement(welcomeMsg, player.id, 0x00FF88, "bold", 0);
        
        // Motivational message based on tier
        const playerData = window.gameRoom.playerList.get(player.id)!;
        const rating = playerData.stats.rating;
        const totals = playerData.stats.totals;
        
        let motivationalMsg = LangRes.welcomeSystem.motivationalMessages.default;
        
        if (totals < 10) {
            const remainingMatches = 10 - totals;
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tierNew.replace('{remainingMatches}', remainingMatches.toString());
        } else if (rating < 400) {
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier1;
        } else if (rating < 800) {
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier2;
        } else if (rating < 1200) {
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier3;
        } else if (rating < 1600) {
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier4;
        } else if (rating < 2000) {
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier5;
        } else if (rating < 2400) {
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier6;
        } else if (rating < 2800) {
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.tier7;
        } else {
            motivationalMsg = LangRes.welcomeSystem.motivationalMessages.challenger;
        }
        
        window.gameRoom._room.sendAnnouncement(motivationalMsg, player.id, 0xFFD700, "normal", 0);
        
        // Discord invitation
        window.gameRoom._room.sendAnnouncement(LangRes.scheduler.advertise, player.id, 0x7289DA, "normal", 0);
    }, 1500);

    // Send notice if exists
    if(window.gameRoom.notice !== '') {
        setTimeout(() => {
            window.gameRoom._room.sendAnnouncement(window.gameRoom.notice, player.id, 0x55AADD, "bold", 0);
        }, 2500);
    }
    
    // Show player stats after welcome
    setTimeout(() => {
        const playerData = window.gameRoom.playerList.get(player.id)!;
        if (playerData.stats.totals > 0) {
            const statsMsg = `📊 Tus estadísticas: ${playerData.stats.totals} partidos, ${playerData.stats.wins} victorias (${Math.round((playerData.stats.wins / playerData.stats.totals) * 100)}%), Rating: ${Math.round(playerData.stats.rating)} pts`;
            window.gameRoom._room.sendAnnouncement(statsMsg, player.id, 0x00AA00, "normal", 0);
        }
    }, 3000);
    
    // Show game rules info
    setTimeout(() => {
        const rulesMsg = `🏆 Reglas: ${window.gameRoom.config.rules.ruleName} | Tiempo: ${window.gameRoom.config.rules.requisite.timeLimit}min | Goles: ${window.gameRoom.config.rules.requisite.scoreLimit} | Mín jugadores: ${window.gameRoom.config.rules.requisite.minimumPlayers}`;
        window.gameRoom._room.sendAnnouncement(rulesMsg, player.id, 0x479947, "small", 0);
    }, 3500);

    // Simple team assignment
    if (window.gameRoom.config.rules.autoOperating === true) {
        const redCount = Array.from(window.gameRoom.playerList.values())
            .filter(p => p.team === TeamID.Red).length;
        const blueCount = Array.from(window.gameRoom.playerList.values())
            .filter(p => p.team === TeamID.Blue).length;
        
        const targetTeam = redCount <= blueCount ? TeamID.Red : TeamID.Blue;
        window.gameRoom._room.setPlayerTeam(player.id, targetTeam);
        
        // Auto start if no game running
        if (window.gameRoom._room.getScores() === null) {
            window.gameRoom._room.startGame();
        }
    }

    // Emit websocket event if function exists
    if (typeof window._emitSIOPlayerInOutEvent === 'function') {
        window._emitSIOPlayerInOutEvent(player.id);
    }
}