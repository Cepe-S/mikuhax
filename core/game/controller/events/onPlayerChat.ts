
import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { isCommandString, parseCommand, isPrivateMessage, handlePrivateMessage } from "../Parser";
import { getUnixTimestamp } from "../Statistics";
import { convertTeamID2Name, TeamID } from "../../model/GameObject/TeamID";
import { isIncludeBannedWords } from "../TextFilter";
import { decideTier, getTierName, getTierColor, Tier, isPlayerInTop20 } from "../../model/Statistics/Tier";
import { qDetector } from "../QDetector";

export function onPlayerChatListener(player: PlayerObject, message: string): boolean {
    // Event called when a player sends a chat message.
    // The event function can return false in order to filter the chat message.
    // Then It prevents the chat message from reaching other players in the room.

    //TODO: CHAT FILTERING : https://github.com/web-mech/badwords

    window.gameRoom.logger.i('onPlayerChat', `[${player.name}#${player.id}] ${message}`);

    // Procesar mensaje con el detector de "q"
    qDetector.processMessage(player.name, player.id, message);

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

    // Check for private messages before processing commands
    if (isPrivateMessage(message)) {
        handlePrivateMessage(player, message);
        return false; // Hide the message from public chat
    }

    if (isCommandString(message) === true) { // if this message is command chat
        parseCommand(player, message); // evaluate it
        return false; // and show this message for only him/herself
    } else { // if this message is normal chat
        // Check if player is muted (admins can bypass mute)
        if (!player.admin && (window.gameRoom.isMuteAll === true || window.gameRoom.playerList.get(player.id)!.permissions['mute'] === true)) { // if this player is muted or whole chat is frozen
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.onChat.mutedChat, placeholderChat), player.id, 0xFF0000, "bold", 2); // notify that fact
            return false; // and hide this chat
        }
        
        // Continue with message processing for all players (including admins)
        if (!player.admin) { // Only apply anti-flood and filters to non-admins
                // Anti Chat Flood Checking - Optimized per-player tracking
                if (window.gameRoom.config.settings.antiChatFlood === true && window.gameRoom.isStatRecord === true) {
                    const currentTime = getUnixTimestamp() * 1000;
                    const timeWindow = window.gameRoom.config.settings.chatFloodIntervalMillisecs;
                    const playerData = window.gameRoom.playerList.get(player.id)!;
                    
                    // Initialize player's message history if not exists
                    if (!playerData.permissions.chatHistory) {
                        playerData.permissions.chatHistory = [];
                    }
                    
                    // Add current message
                    playerData.permissions.chatHistory.push(currentTime);
                    
                    // Clean old messages for this player only (much more efficient)
                    const cutoffTime = currentTime - timeWindow;
                    playerData.permissions.chatHistory = playerData.permissions.chatHistory.filter(timestamp => timestamp > cutoffTime);
                    
                    // Count messages in window
                    const playerMessagesInWindow = playerData.permissions.chatHistory.length;
                    
                    // Only mute if player exceeded the criterion within the time window AND is not already muted
                    if (playerMessagesInWindow >= window.gameRoom.config.settings.chatFloodCriterion && 
                        playerData.permissions['mute'] === false) {
                        
                        // Apply mute (use consistent timestamp format)
                        playerData.permissions['mute'] = true;
                        playerData.permissions.muteExpire = (currentTime / 1000) + window.gameRoom.config.settings.muteDefaultMillisecs;
                        
                        // Save to database
                        window._createMuteDB(
                            window.gameRoom.config._RUID,
                            player.auth,
                            player.conn,
                            'Chat flood/spam',
                            Math.floor(window.gameRoom.config.settings.muteDefaultMillisecs / 60000),
                            'system',
                            'Anti-spam System'
                        ).catch(error => {
                            window.gameRoom.logger.e('onPlayerChat', `Error saving mute to DB: ${error}`);
                        });
                        
                        // Notify about the mute
                        window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.antitrolling.chatFlood.muteReason, placeholderChat), null, 0xFF0000, "normal", 1);
                        
                        // Log the action with better formatting
                        window.gameRoom.logger.i('onPlayerChat', `🔇 Player ${player.name}#${player.id} muted for spam: ${playerMessagesInWindow} messages in ${timeWindow/1000}s`);
                        
                        // Clear player's chat history after mute
                        playerData.permissions.chatHistory = [];
                        
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
        }
        
        // Apply custom formatting to ALL players (including admins)
        // Interceptar mensaje y enviarlo con formato personalizado
                const playerData = window.gameRoom.playerList.get(player.id)!;
                const teamEmoji = player.team === TeamID.Red ? '🔴' : player.team === TeamID.Blue ? '🔵' : '⚪';
                
                const playerTier = decideTier(playerData.stats.rating, player.id);
                const tierEmoji = getTierName(playerTier);
                const adminIndicator = (player.admin || playerData.permissions.superadmin) ? '👑' : '';
                
                const customMessage = `${tierEmoji} « 🆔:${player.id} » ${teamEmoji} ~ ${adminIndicator}${player.name}: ${message}`;
                let msgColor = 0xFFFFFF; // default white
                
                // Check if player is TOP 20 or admin for bold formatting
                const top20Check = isPlayerInTop20(player.id);
                const isAdmin = player.admin || playerData.permissions.superadmin;
                const isTop20 = top20Check.isTop20;
                
                // Use bold formatting for TOP 20 players and admins
                const messageStyle = (isTop20 || isAdmin) ? "bold" : "normal";
                
                // Los admins tienen color dorado, independientemente del equipo
                if (isAdmin) {
                    msgColor = 0xFFD700; // dorado
                } else {
                    // Colores por equipo para jugadores normales
                    if (player.team === TeamID.Red) msgColor = 0xFD2C2D; // rojo
                    else if (player.team === TeamID.Blue) msgColor = 0x18fde8; // azul
                    else if (player.team === TeamID.Spec) msgColor = 0xC7C7C7; // gris
                }
        
        // Reproducir sonido de mensaje para todos los jugadores
        window.gameRoom._room.sendAnnouncement(customMessage, null, msgColor, messageStyle, 1);
        return false; // Bloquear el mensaje original
    }
}


