import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { isCommandString, parseCommand, isPrivateMessage, handlePrivateMessage } from "../Parser";
import { getUnixTimestamp } from "../Statistics";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";

export function onPlayerChatListener(player: PlayerObject, message: string): boolean {
    window.gameRoom.logger.i('onPlayerChat', `[${player.name}#${player.id}] ${message}`);

    var placeholderChat = {
        playerID: player.id,
        playerName: player.name,
        gameRuleName: window.gameRoom.config.rules.ruleName,
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count
    };

    // Check for private messages
    if (isPrivateMessage(message)) {
        handlePrivateMessage(player, message);
        return false;
    }

    if (isCommandString(message) === true) {
        parseCommand(player, message);
        return false;
    } else {
        // Check if player is muted
        const playerData = window.gameRoom.playerList.get(player.id)!;
        if (!player.admin && window.gameRoom.isMuteAll === true) {
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.mutedChat, placeholderChat), player.id, 0xFF0000, "bold", 2);
            return false;
        }
        
        // Check individual mute with expiration
        if (!player.admin && playerData.permissions.mute) {
            if (playerData.permissions.muteExpire !== -1 && playerData.permissions.muteExpire <= Date.now()) {
                // Mute expired, remove it
                playerData.permissions.mute = false;
                playerData.permissions.muteExpire = -1;
                window._deleteMuteByAuthDB(window.gameRoom.config._RUID, player.auth);
                
                // Add debug tracking for automatic expiration
                if (!window.gameRoom.muteDebugActions) {
                    window.gameRoom.muteDebugActions = [];
                }
                window.gameRoom.muteDebugActions.unshift({
                    timestamp: Date.now(),
                    action: 'MUTE_EXPIRED',
                    playerName: player.name,
                    playerId: player.id,
                    duration: 0,
                    reason: 'Automatic expiration',
                    expireTime: -1
                });
                if (window.gameRoom.muteDebugActions.length > 20) {
                    window.gameRoom.muteDebugActions = window.gameRoom.muteDebugActions.slice(0, 20);
                }
            } else {
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.mutedChat, placeholderChat), player.id, 0xFF0000, "bold", 2);
                return false;
            }
        }
        
        // Anti-spam check
        if (!window.gameRoom.chatFloodManager.checkMessage(player, message)) {
            return false; // Mensaje bloqueado por antispam
        }
        
        // Message length check
        if(message.length > window.gameRoom.config.settings.chatLengthLimit) {
            window.gameRoom._room.sendAnnouncement("Mensaje demasiado largo", player.id, 0xFF0000, "bold", 2);
            return false;
        }
        
        // Separator check
        if(message.includes('|,|')) {
            window.gameRoom._room.sendAnnouncement("Separador no permitido", player.id, 0xFF0000, "bold", 2);
            return false;
        }
        
        // Simple custom formatting
        const teamEmoji = player.team === TeamID.Red ? '🔴' : player.team === TeamID.Blue ? '🔵' : '⚪';
        const adminIndicator = player.admin ? '👑' : '';
        const customMessage = `${teamEmoji} ${adminIndicator}${player.name}: ${message}`;
        
        let msgColor = 0xFFFFFF;
        if (player.admin) {
            msgColor = 0xFFD700; // gold
        } else if (player.team === TeamID.Red) {
            msgColor = 0xFD2C2D; // red
        } else if (player.team === TeamID.Blue) {
            msgColor = 0x18fde8; // blue
        } else {
            msgColor = 0xC7C7C7; // gray
        }
        
        window.gameRoom._room.sendAnnouncement(customMessage, null, msgColor, "normal", 1);
        return false;
    }
}