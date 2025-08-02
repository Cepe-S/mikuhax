import * as LangRes from "../resource/strings";
import { PlayerObject } from "../model/GameObject/PlayerObject";
import { cmdAbout } from "./commands/about";
import { cmdHelp } from "./commands/help";
import { cmdStats } from "./commands/stats";
import { cmdStreak } from "./commands/streak";
import { cmdStatsReset } from "./commands/statsreset";
import { cmdScout } from "./commands/scout";
import { cmdPoss } from "./commands/poss";
import { cmdAfk } from "./commands/afk";
import { cmdList } from "./commands/list";
import { cmdFreeze } from "./commands/freeze";
import { cmdMute } from "./commands/mute";
import { cmdVote } from "./commands/vote";
import { cmdSuper } from "./commands/super";
import { cmdTier } from "./commands/tier";
import { cmdNotice } from "./commands/notice";
import { cmdPowershotAdmin } from "./commands/powershotadmin";
import { cmdDebugPowershot } from "./commands/debugpowershot";
import { cmdGoleadores } from "./commands/goleadores";
import { cmdAsistidores } from "./commands/asistidores";
import { cmdRanking } from "./commands/ranking";
import { cmdAvatar } from "./commands/avatar";
import { cmdMap } from "./commands/map";
import { cmdBalance } from "./commands/balance";
import { cmdCamisetas } from "./commands/camisetas";
import { cmdLlamarAdmin } from "./commands/llamaradmin";

// Check if given string is a command chat. Returns true if it is, false otherwise.
export function isCommandString(message: string): boolean {
    return message.charAt(0) === window.gameRoom.config.commands._commandPrefix;
}

// Divide message into 3 parts by separator: !COMMAND FIRST-ARG SECOND-ARG
export function getCommandChunk(message: string): string[] { 
    return message.split(" ", 3);
}

// Parse command message and execute it (must check if it's a command first)
export function parseCommand(byPlayer: PlayerObject, message: string): void {
    const msgChunk: string[] = getCommandChunk(message);
    const commandSign: string = msgChunk[0].substring(1); // Remove prefix character (default: !)
    
    if(window.gameRoom.config.commands._disabledCommandList?.includes(commandSign)) { // If this command is in disabled list
        window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorDisabled, byPlayer.id, 0xFF7777, "normal", 2); // Notify
        return; // Exit this function
    }
    switch(commandSign) {
        case window.gameRoom.config.commands.help: {
            if(msgChunk[1] !== undefined) {
                cmdHelp(byPlayer, msgChunk[1]);
            } else {
                cmdHelp(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.about: {
            cmdAbout(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.stats: {
            if(msgChunk[1] !== undefined) {
                cmdStats(byPlayer, msgChunk[1]);
            } else {
                cmdStats(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.statsreset: {
            cmdStatsReset(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.streak: {
            cmdStreak(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.scout: {
            cmdScout(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.poss: {
            cmdPoss(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.afk: {
            if(msgChunk[1] !== undefined) {
                cmdAfk(byPlayer, msgChunk[1]);
            } else {
                cmdAfk(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.list: {
            if(msgChunk[1] !== undefined) {
                cmdList(byPlayer, msgChunk[1]);
            } else {
                cmdList(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.freeze: {
            cmdFreeze(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.mute: {
            if(msgChunk[1] !== undefined) {
                cmdMute(byPlayer, msgChunk[1]);
            } else {
                cmdMute(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.vote: {
            if(msgChunk[1] !== undefined) {
                cmdVote(byPlayer, msgChunk[1]);
            } else {
                cmdVote(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.tier: {
            cmdTier(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.notice: {
            cmdNotice(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.powershotadmin: {
            cmdPowershotAdmin(byPlayer, message);
            break;
        }
        case "debugpowershot": {
            cmdDebugPowershot(byPlayer, message);
            break;
        }
        case window.gameRoom.config.commands.super: {
            if(msgChunk[1] !== undefined) {
                if(msgChunk[2] !== undefined) {
                    cmdSuper(byPlayer, msgChunk[1], msgChunk[2]);
                } else {
                    cmdSuper(byPlayer, msgChunk[1]);
                }
            } else {
                cmdSuper(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.goleadores: {
            if(msgChunk[1] !== undefined) {
                cmdGoleadores(byPlayer, msgChunk[1]);
            } else {
                cmdGoleadores(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.asistidores: {
            if(msgChunk[1] !== undefined) {
                cmdAsistidores(byPlayer, msgChunk[1]);
            } else {
                cmdAsistidores(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.ranking: {
            cmdRanking(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.avatar: {
            cmdAvatar(byPlayer, message);
            break;
        }
        case window.gameRoom.config.commands.map: {
            if(msgChunk[1] !== undefined) {
                cmdMap(byPlayer, msgChunk[1]);
            } else {
                cmdMap(byPlayer);
            }
            break;
        }
        case window.gameRoom.config.commands.balance: {
            cmdBalance(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.camisetas: {
            cmdCamisetas(byPlayer);
            break;
        }
        case window.gameRoom.config.commands.llamaradmin: {
            if(msgChunk[1] !== undefined) {
                cmdLlamarAdmin(byPlayer, msgChunk.slice(1).join(" "));
            } else {
                cmdLlamarAdmin(byPlayer);
            }
            break;
        }
        default: {
            window.gameRoom._room.sendAnnouncement(LangRes.command._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
            break;
        }
    }
}
