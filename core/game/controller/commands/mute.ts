import { getUnixTimestamp } from "../Statistics";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { registerCommand } from "../CommandRegistry";

export function cmdMute(byPlayer: PlayerObject, message?: string): void {
    console.log(`[DEBUG] cmdMute called with message: "${message}"`);
    if(window.gameRoom.playerList.get(byPlayer.id)!.admin == true || window.gameRoom.playerList.get(byPlayer.id)!.permissions.superadmin == true) {
        if(message !== undefined && message.trim() !== '') {
            // Split the full message and remove the command part (!mute)
            const fullParts = message.trim().split(' ').filter(part => part !== '');
            const parts = fullParts.slice(1); // Remove the command (!mute) from the parts
            console.log(`[DEBUG] fullParts:`, fullParts, `parts:`, parts);
            
            if(parts.length >= 1 && parts[0].startsWith("#")) {
                console.log(`[DEBUG] Valid command format detected`);
                const target: number = parseInt(parts[0].substring(1), 10);
                
                // Parse duration - if not provided or invalid, default to 0 (permanent)
                let durationMinutes: number = 0; // Default to permanent
                if(parts.length >= 2 && parts[1] !== '') {
                    const parsedDuration = parseInt(parts[1], 10);
                    if(!isNaN(parsedDuration) && parsedDuration >= 0) {
                        durationMinutes = parsedDuration;
                    }
                }
                
                // Parse reason - if not provided, use default
                const reason: string = parts.length >= 3 ? parts.slice(2).join(' ') : 'Muted by admin';
                
                if(isNaN(target) != true && window.gameRoom.playerList.has(target) == true) {
                    const targetPlayer = window.gameRoom.playerList.get(target)!;
                    
                    if(targetPlayer.permissions.mute === true) {
                        // Unmute player
                        targetPlayer.permissions.mute = false;
                        targetPlayer.permissions.muteExpire = 0;
                        
                        // Remove from database
                        window._deleteMuteByAuthDB(window.gameRoom.config._RUID, targetPlayer.auth).then(() => {
                            const placeholder = { targetName: targetPlayer.name, ticketTarget: target };
                            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.mute.successUnmute, placeholder), null, 0x479947, "normal", 1);
                            window.gameRoom.logger.i('mute', `${byPlayer.name}#${byPlayer.id} unmuted ${targetPlayer.name}#${target}`);
                        }).catch((error) => {
                            console.error("Unmute database error:", error);
                        });
                    } else {
                        // Mute player
                        const mutedTimeStamp: number = getUnixTimestamp();
                        const muteExpire = durationMinutes > 0 ? mutedTimeStamp + (durationMinutes * 60 * 1000) : -1;
                        
                        if(window.gameRoom.config.settings.antiMuteAbusing === true && durationMinutes > 0) {
                            if(mutedTimeStamp > targetPlayer.permissions.muteExpire + window.gameRoom.config.settings.muteAllowIntervalMillisecs) {
                                // Apply mute
                                targetPlayer.permissions.mute = true;
                                targetPlayer.permissions.muteExpire = muteExpire;
                                
                                // Save to database
                                window._createMuteDB(
                                    window.gameRoom.config._RUID,
                                    targetPlayer.auth,
                                    targetPlayer.conn,
                                    reason,
                                    durationMinutes,
                                    byPlayer.auth,
                                    byPlayer.name
                                ).then(() => {
                                    const placeholder = { targetName: targetPlayer.name, ticketTarget: target };
                                    const successMsg = durationMinutes > 0 
                                        ? `🔇 ${targetPlayer.name} has been muted for ${durationMinutes} minutes. Reason: ${reason}`
                                        : `🔇 ${targetPlayer.name} has been permanently muted. Reason: ${reason}`;
                                    window.gameRoom._room.sendAnnouncement(successMsg, null, 0x479947, "normal", 1);
                                    window.gameRoom.logger.i('mute', `${byPlayer.name}#${byPlayer.id} muted ${targetPlayer.name}#${target} for ${durationMinutes}min. Reason: ${reason}`);
                                }).catch((error) => {
                                    console.error("Mute database error:", error);
                                });
                            } else {
                                const placeholder = { targetName: targetPlayer.name, ticketTarget: target };
                                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.mute.muteAbusingWarn, placeholder), byPlayer.id, 0xFF7777, "normal", 2);
                            }
                        } else {
                            // Apply mute without anti-abuse check
                            targetPlayer.permissions.mute = true;
                            targetPlayer.permissions.muteExpire = muteExpire;
                            
                            // Save to database
                            window._createMuteDB(
                                window.gameRoom.config._RUID,
                                targetPlayer.auth,
                                targetPlayer.conn,
                                reason,
                                durationMinutes,
                                byPlayer.auth,
                                byPlayer.name
                            ).then(() => {
                                const successMsg = durationMinutes > 0 
                                    ? `🔇 ${targetPlayer.name} has been muted for ${durationMinutes} minutes. Reason: ${reason}`
                                    : `🔇 ${targetPlayer.name} has been permanently muted. Reason: ${reason}`;
                                window.gameRoom._room.sendAnnouncement(successMsg, null, 0x479947, "normal", 1);
                                window.gameRoom.logger.i('mute', `${byPlayer.name}#${byPlayer.id} muted ${targetPlayer.name}#${target} for ${durationMinutes}min. Reason: ${reason}`);
                            }).catch((error) => {
                                console.error("Mute database error:", error);
                            });
                        }
                    }

                    window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
                } else {
                    window.gameRoom._room.sendAnnouncement(LangRes.command.mute._ErrorNoPlayer, byPlayer.id, 0xFF7777, "normal", 2);
                }
            } else {
                console.log(`[DEBUG] Invalid command format. parts.length: ${parts.length}, first part: "${parts[0]}"`);
                window.gameRoom._room.sendAnnouncement("❌ Usage: !mute #ID [minutes] [reason] - Minutes and reason are optional", byPlayer.id, 0xFF7777, "normal", 2);
            }
        } else {
            console.log(`[DEBUG] Empty or undefined message`);
            window.gameRoom._room.sendAnnouncement("❌ Usage: !mute #ID [minutes] [reason] - Minutes and reason are optional", byPlayer.id, 0xFF7777, "normal", 2);
        }
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.mute._ErrorNoPermission, byPlayer.id, 0xFF7777, "normal", 2);
    }
}

// Register the command
registerCommand("mute", cmdMute, {
    helpText: "Mute/unmute a player. Usage: !mute #ID [minutes] [reason]. Minutes and reason are optional - leave empty for permanent mute with default reason.",
    category: "Admin Commands",
    requiresArgs: true,
    adminOnly: true
});
