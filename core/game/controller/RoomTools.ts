import * as Tst from "./Translator";
import * as LangRes from "../resource/strings";
import { PlayerObject } from "../model/GameObject/PlayerObject";
import { convertTeamID2Name, TeamID } from "../model/GameObject/TeamID";
import { getPlayerDisplayName } from "../model/Statistics/Tier";
import { getRandomMatch } from "../resource/realTeams";

// Stadium functions moved to StadiumManager

export function setDefaultRoomLimitation(): void {
    window.gameRoom._room.setScoreLimit(window.gameRoom.config.rules.requisite.scoreLimit);
    window.gameRoom._room.setTimeLimit(window.gameRoom.config.rules.requisite.timeLimit);
    window.gameRoom._room.setTeamsLock(window.gameRoom.config.rules.requisite.teamLock);
}

export function updateAdmins(): void {
    let placeholderUpdateAdmins = {
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

    // Get all players except the host (id = 0 is always the host)
    let players = window.gameRoom._room.getPlayerList().filter(
            // only no afk mode players
            (player: PlayerObject) => player.id !== 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode !== true
        ).sort(
            (a: PlayerObject, b: PlayerObject) => {
                return window.gameRoom.playerList.get(a.id)!.stats.rating
                        - window.gameRoom.playerList.get(b.id)!.stats.rating
            }
        );
    if (players.length == 0) return; // If no players left, do nothing.
    if (players.find((player: PlayerObject) => player.admin) != null) return; // Do nothing if any admin player is still left.

    placeholderUpdateAdmins.playerID = players[0].id;
    placeholderUpdateAdmins.playerName = getPlayerDisplayName(players[0].id, window.gameRoom.playerList.get(players[0].id)!.name, true, window.gameRoom.playerList.get(players[0].id)!.permissions.superadmin);

    window.gameRoom._room.setPlayerAdmin(players[0]!.id, true); // Give admin to the first non admin player in the list
    window.gameRoom.playerList.get(players[0].id)!.admin = true;
    window.gameRoom.logger.i('updateAdmins', `${window.gameRoom.playerList.get(players[0].id)!.name}#${players[0].id} has been admin(value:${window.gameRoom.playerList.get(players[0].id)!.admin},super:${window.gameRoom.playerList.get(players[0].id)!.permissions.superadmin}), because there were no admin players.`);
    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.funcUpdateAdmins.newAdmin, placeholderUpdateAdmins), null, 0x00FF00, "normal", 0);
}

export function shuffleArray<T>(array: T[]): T[] {
    if (!Array.isArray(array)) {
        throw new TypeError(`shuffleArray: Expected an Array, got ${typeof array} instead.`);
    }

    const oldArray = [...array];
    let newArray = new Array<T>();

    while (oldArray.length) {
        const i = Math.floor(Math.random() * oldArray.length);
        newArray = newArray.concat(oldArray.splice(i, 1));
    }

    return newArray;
}

export function getCookieFromHeadless(name: string): string {
    let result = new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)').exec(document.cookie);
    return result ? result[1] : '';
}

export function setRandomTeamColors(): boolean {
    try {
        const randomMatch = getRandomMatch();
        if (!randomMatch) {
            window.gameRoom.logger.w('setRandomTeamColors', 'No random match available');
            return false;
        }

        // Update team colors in gameRoom
        window.gameRoom.teamColours = {
            red: {
                angle: randomMatch.red.angle,
                textColour: randomMatch.red.textColour,
                teamColour1: randomMatch.red.teamColour1,
                teamColour2: randomMatch.red.teamColour2 || randomMatch.red.teamColour1,
                teamColour3: randomMatch.red.teamColour3 || randomMatch.red.teamColour1
            },
            blue: {
                angle: randomMatch.blue.angle,
                textColour: randomMatch.blue.textColour,
                teamColour1: randomMatch.blue.teamColour1,
                teamColour2: randomMatch.blue.teamColour2 || randomMatch.blue.teamColour1,
                teamColour3: randomMatch.blue.teamColour3 || randomMatch.blue.teamColour1
            }
        };

        // Apply colors to room
        window.gameRoom._room.setTeamColors(1, window.gameRoom.teamColours.red.angle, window.gameRoom.teamColours.red.textColour, [window.gameRoom.teamColours.red.teamColour1, window.gameRoom.teamColours.red.teamColour2, window.gameRoom.teamColours.red.teamColour3]);
        window.gameRoom._room.setTeamColors(2, window.gameRoom.teamColours.blue.angle, window.gameRoom.teamColours.blue.textColour, [window.gameRoom.teamColours.blue.teamColour1, window.gameRoom.teamColours.blue.teamColour2, window.gameRoom.teamColours.blue.teamColour3]);

        // Announce the new teams
        window.gameRoom._room.sendAnnouncement(
            `🎽 Nuevos equipos: ${randomMatch.blue.name} vs ${randomMatch.red.name}`,
            null,
            0x00BFFF,
            "bold",
            2
        );

        window.gameRoom.logger.i('setRandomTeamColors', `Teams changed to: ${randomMatch.blue.name} vs ${randomMatch.red.name}`);
        return true;
    } catch (error) {
        window.gameRoom.logger.e('setRandomTeamColors', `Failed to set random team colors: ${error}`);
        return false;
    }
}
