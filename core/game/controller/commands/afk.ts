import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import { getUnixTimestamp } from "../Statistics";
import { roomActivePlayersNumberCheck, assignPlayerToBalancedTeam, balanceTeams } from "../../model/OperateHelper/Quorum";
import { QueueSystem } from "../../model/OperateHelper/QueueSystem";
import { registerCommand } from "../CommandRegistry";
import { EloIntegrityTracker } from "../../model/Statistics/EloIntegrityTracker";

export function cmdAfk(byPlayer: PlayerObject, message?: string): void {
    var placeholder = {
        targetName: byPlayer.name
        ,ticketTarget: byPlayer.id
        ,targetAfkReason: ''
        ,gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
    }
    if (window.gameRoom.playerList.get(byPlayer.id)!.permissions.afkmode === true) { // if this player is AFK
        window.gameRoom.playerList.get(byPlayer.id)!.permissions.afkmode = false; // return to active mode
        window.gameRoom.playerList.get(byPlayer.id)!.permissions.afkreason = ''; // init
        window.gameRoom.playerList.get(byPlayer.id)!.afktrace = { exemption: false, count: 0 }; // reset for afk trace
        
        // Balancear equipos cuando un jugador sale del AFK
        if (window.gameRoom.config.rules.autoOperating === true) {
            const queueSystem = QueueSystem.getInstance();
            
            // Check if queue system should handle the returning player
            const queueHandled = queueSystem.onPlayerReturnsFromAFK(byPlayer.id);
            
            if (!queueHandled) {
                // Queue system doesn't need to handle it, use normal assignment
                assignPlayerToBalancedTeam(byPlayer.id);
                window.gameRoom.logger.i('cmdAfk', `Player ${byPlayer.name}#${byPlayer.id} returned from AFK and was assigned to balanced team`);
            }
        }
        
        if(window.gameRoom.config.settings.antiAFKFlood === true && window.gameRoom.playerList.get(byPlayer.id)!.permissions.mute === true) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.afk.unAfk, placeholder), byPlayer.id, 0x479947, "normal", 1);
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.afk.muteNotifyWarn, placeholder), byPlayer.id, 0xFF7777, "normal", 2);
        } else {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.afk.unAfk, placeholder), null, 0x479947, "normal", 1);
        }
    } else { // if this player is not AFK (in active)
        if(window.gameRoom.config.settings.antiAFKAbusing === true && window.gameRoom.playerList.get(byPlayer.id)!.team !== TeamID.Spec) {
            // if in game situation and this player is in team, prevent AFK abusing
            window.gameRoom._room.sendAnnouncement(LangRes.antitrolling.afkAbusing.cannotReason, byPlayer.id, 0xFF7777, "normal", 2); //warn
            return; //abort this event
        }
        // Check for ELO integrity violation before going AFK
        const eloTracker = EloIntegrityTracker.getInstance();
        const violationDetected = eloTracker.onPlayerAFK(byPlayer, true);
        
        window.gameRoom._room.setPlayerTeam(byPlayer.id, TeamID.Spec); // Moves this player to Spectators team.
        // Mantener permisos de admin para superadmins incluso en AFK
        if (!window.gameRoom.playerList.get(byPlayer.id)!.permissions.superadmin) {
            window.gameRoom._room.setPlayerAdmin(byPlayer.id, false); // disqulify admin permission
            window.gameRoom.playerList.get(byPlayer.id)!.admin = false;
        }
        window.gameRoom.playerList.get(byPlayer.id)!.permissions.afkmode = true; // set afk mode
        window.gameRoom.playerList.get(byPlayer.id)!.permissions.afkdate = getUnixTimestamp(); // set afk beginning time stamp
        window.gameRoom.playerList.get(byPlayer.id)!.afktrace = { exemption: false, count: 0}; // reset for afk trace

        // Handle AFK with queue system integration
        if (window.gameRoom.config.rules.autoOperating === true) {
            const queueSystem = QueueSystem.getInstance();
            
            // Notify queue system that player went AFK (will process queue if active)
            queueSystem.onPlayerGoesAFK(byPlayer.id);
            
            // Also use the traditional balance system as backup
            setTimeout(() => {
                balanceTeams();
                window.gameRoom.logger.i('cmdAfk', `Teams rebalanced after player ${byPlayer.name}#${byPlayer.id} went AFK`);
            }, 500); // Pequeño delay para asegurar que el cambio de equipo se procesó
        }

        if(message !== undefined) { // if the reason is not skipped
            window.gameRoom.playerList.get(byPlayer.id)!.permissions.afkreason = message; // set reason
            placeholder.targetAfkReason = message; // update placeholder
        }
        
        if(window.gameRoom.config.settings.antiAFKFlood === true && window.gameRoom.playerList.get(byPlayer.id)!.permissions.mute === true) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.afk.setAfk, placeholder), byPlayer.id, 0x479947, "normal", 1);
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.afk.muteNotifyWarn, placeholder), byPlayer.id, 0xFF7777, "normal", 2);
        } else {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.afk.setAfk, placeholder), null, 0x479947, "normal", 1);
        }

        if(window.gameRoom.config.settings.afkCommandAutoKick === true) {
            window.gameRoom._room.sendAnnouncement(LangRes.command.afk._WarnAfkTooLong, byPlayer.id, 0x479947, "normal", 1);
        }
    }
    // check number of players and change game mode
    if (window.gameRoom.config.rules.statsRecord === true && roomActivePlayersNumberCheck() >= window.gameRoom.config.rules.requisite.minimumPlayers) {
        if (window.gameRoom.isStatRecord !== true) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.afk.startRecord, placeholder), null, 0x00FF00, "normal", 0);
            window.gameRoom.isStatRecord = true;
        }
    } else {
        if (window.gameRoom.isStatRecord !== false) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.afk.stopRecord, placeholder), null, 0x00FF00, "normal", 0);
            window.gameRoom.isStatRecord = false;
        }
    }

    window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
}

// Register the command
registerCommand("afk", cmdAfk, {
    helpText: "💤 Te marca como AFK/jugando. Uso: !afk [razón]",
    category: "Basic Commands",
    requiresArgs: false
});
