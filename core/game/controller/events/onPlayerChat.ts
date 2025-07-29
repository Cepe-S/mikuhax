
import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { isCommandString, parseCommand } from "../Parser";
import { getUnixTimestamp } from "../Statistics";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { isIncludeBannedWords } from "../TextFilter";
import { decideTier, getTierName, getTierColor, Tier } from "../../model/Statistics/Tier";

function getTierTitle(tier: Tier): string {
    if(tier === Tier.TierNew) return '⌈⚪⌋'; // Placement
    if(tier === Tier.Tier1) return '⌈🟤⌋'; // Bronze
    if(tier === Tier.Tier2) return '⌈⚪⌋'; // Silver
    if(tier === Tier.Tier3) return '⌈🟡⌋'; // Gold
    if(tier === Tier.Tier4) return '【⌈🟦⌋】'; // Platinum
    if(tier === Tier.Tier5) return '【⌈🟩⌋】'; // Emerald
    if(tier === Tier.Tier6) return '【⌈✨💎✨⌋】'; // Diamond
    if(tier === Tier.Tier7) return '【⌈✨👑✨⌋】'; // Master
    if(tier === Tier.Challenger) return '【⌈✨🚀✨⌋】'; // Challenger
    if(tier >= Tier.Tier8 && tier <= Tier.Tier27) return '【⌈✨🌸✨⌋】'; // Top Rankings
    return '❓'; // Unknown
}

export function onPlayerChatListener(player: PlayerObject, message: string): boolean {
    // Event called when a player sends a chat message.
    // The event function can return false in order to filter the chat message.
    // Then It prevents the chat message from reaching other players in the room.

    //TODO: CHAT FILTERING : https://github.com/web-mech/badwords

    window.gameRoom.logger.i('onPlayerChat', `[${player.name}#${player.id}] ${message}`);

    var placeholderChat = {
        playerID: player.id,
        playerName: player.name,
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers,
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red),
        possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
        streakTeamName: convertTeamID2Name(window.gameRoom.winningStreak.teamID),
        streakTeamCount: window.gameRoom.winningStreak.count
    };

    // =========

    if (isCommandString(message) === true) { // if this message is command chat
        parseCommand(player, message); // evaluate it
        return false; // and show this message for only him/herself
    } else { // if this message is normal chat
        if (player.admin === true) { // if this player is admin
            return true; // admin can chat regardless of mute
        } else {
            if (window.gameRoom.isMuteAll === true || window.gameRoom.playerList.get(player.id)!.permissions['mute'] === true) { // if this player is muted or whole chat is frozen
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.mutedChat, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
                return false; // and hide this chat
            } else {
                // Anti Chat Flood Checking - Intelligent Time-based Spam Detection
                if (window.gameRoom.config.settings.antiChatFlood === true && window.gameRoom.isStatRecord === true) {
                    const currentTime = getUnixTimestamp() * 1000; // Convert to milliseconds for precision
                    const timeWindow = window.gameRoom.config.settings.chatFloodIntervalMillisecs;
                    const playerData = window.gameRoom.playerList.get(player.id)!;
                    
                    // Add current message with timestamp
                    window.gameRoom.antiTrollingChatFloodCount.push({ 
                        playerID: player.id, 
                        timestamp: currentTime 
                    });
                    
                    // Clean old messages outside the time window in a single pass
                    const cutoffTime = currentTime - timeWindow;
                    window.gameRoom.antiTrollingChatFloodCount = window.gameRoom.antiTrollingChatFloodCount.filter(
                        record => record.timestamp > cutoffTime
                    );
                    
                    // Count this player's messages in the current time window
                    const playerMessagesInWindow = window.gameRoom.antiTrollingChatFloodCount.filter(
                        record => record.playerID === player.id
                    ).length;
                    
                    // Only mute if player exceeded the criterion within the time window AND is not already muted
                    if (playerMessagesInWindow >= window.gameRoom.config.settings.chatFloodCriterion && 
                        playerData.permissions['mute'] === false) {
                        
                        // Apply mute (use consistent timestamp format)
                        playerData.permissions['mute'] = true;
                        playerData.permissions.muteExpire = (currentTime / 1000) + window.gameRoom.config.settings.muteDefaultMillisecs;
                        
                        // Notify about the mute
                        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.antitrolling.chatFlood.muteReason, placeholderChat), null, 0xFF0000, "normal", 1);
                        
                        // Log the action with better formatting
                        window.gameRoom.logger.i('onPlayerChat', `🔇 Player ${player.name}#${player.id} muted for spam: ${playerMessagesInWindow} messages in ${timeWindow/1000}s`);
                        
                        window._emitSIOPlayerStatusChangeEvent(player.id);
                        return false;
                    }
                }
                // Message Length Limitation Check
                if(message.length > window.gameRoom.config.settings.chatLengthLimit) {
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.tooLongChat, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
                    return false;
                }
                // if this player use seperator (|,|) in chat message
                if(message.includes('|,|')) {
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.includeSeperator, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
                    return false;
                }
                // Check if includes banned words
                if(window.gameRoom.config.settings.chatTextFilter === true && isIncludeBannedWords(window.gameRoom.bannedWordsPool.chat, message)) {
                    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.bannedWords, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
                    return false;
                }
                // Interceptar mensaje y enviarlo con formato personalizado
                const playerData = window.gameRoom.playerList.get(player.id)!;
                const teamEmoji = player.team === TeamID.Red ? '🔴' : player.team === TeamID.Blue ? '🔵' : '⚪';
                
                const playerTier = decideTier(playerData.stats.rating, player.id);
                const tierEmoji = getTierTitle(playerTier);
                const adminIndicator = player.admin ? '⭐' : '';
                const superAdminIndicator = playerData.permissions.superadmin ? '👑' : '';
                
                const customMessage = `${tierEmoji} 🆔:${player.id} » ${teamEmoji} ~ ${superAdminIndicator}${adminIndicator}${player.name}: ${message}`;
                let msgColor = 0xFFFFFF; // default white
                if (player.team === TeamID.Red) msgColor = 0xFF3333; // rojo
                else if (player.team === TeamID.Blue) msgColor = 0x3399FF; // azul
                else if (player.team === TeamID.Spec) msgColor = 0xC7C7C7; // gris
                window.gameRoom._room.sendAnnouncement(customMessage, null, msgColor, "normal", 0);
                return false; // Bloquear el mensaje original
            }
        }
    }
}
