import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { superAdminLogin } from "../SuperAdmin";

export async function cmdAdmin(byPlayer: PlayerObject, message?: string, submessage?: string): Promise<void> {
    const playerData = window.gameRoom.playerList.get(byPlayer.id)!;
    
    if (message !== undefined) {
        switch (message) {
            case window.gameRoom.config.commands._adminSublogin: {
                if (playerData.admin === false) { // only when not yet admin
                    if (submessage !== undefined) { // key check and login
                        if (await superAdminLogin(submessage) === true) { // if login key is matched (same keys as super admin)
                            // Set admin permissions
                            window.gameRoom._room.setPlayerAdmin(byPlayer.id, true);
                            playerData.admin = true;
                            
                            // Notify success
                            window.gameRoom._room.sendAnnouncement(LangRes.command.admin.loginSuccess, byPlayer.id, 0x479947, "normal", 2);
                            
                            // Log success with masked key for security
                            const maskedKey = submessage.length > 4 ? submessage.substring(0, 2) + '*'.repeat(submessage.length - 4) + submessage.substring(submessage.length - 2) : '***';
                            window.gameRoom.logger.i('admin', `${byPlayer.name}#${byPlayer.id} successfully logged in as admin (KEY: ${maskedKey})`);
                            
                            window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
                        } else {
                            // Handle failed login attempt
                            playerData.permissions.malActCount++;
                            window.gameRoom._room.sendAnnouncement(LangRes.command.admin.loginFail, byPlayer.id, 0xFF7777, "normal", 2);
                            
                            // Log failed attempt with masked key
                            const maskedKey = submessage.length > 4 ? submessage.substring(0, 2) + '*'.repeat(submessage.length - 4) + submessage.substring(submessage.length - 2) : '***';
                            window.gameRoom.logger.i('admin', `${byPlayer.name}#${byPlayer.id} failed admin login attempt (KEY: ${maskedKey})`);
                        
                            // Check if player should be banned for malicious behavior
                            if(playerData.permissions.malActCount >= window.gameRoom.config.settings.maliciousBehaviourBanCriterion) {
                                window.gameRoom._room.kickPlayer(byPlayer.id, LangRes.antitrolling.malAct.banReason, true); // ban
                            }
                        }
                    } else {
                        window.gameRoom._room.sendAnnouncement(LangRes.command.admin.loginFailNoKey, byPlayer.id, 0xFF7777, "normal", 2);
                    }
                } else {
                    window.gameRoom._room.sendAnnouncement(LangRes.command.admin._ErrorLoginAlready, byPlayer.id, 0xFF7777, "normal", 2);
                }
                break;
            }

            default: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.admin._ErrorWrongCommand, byPlayer.id, 0xFF7777, "normal", 2);
                break;
            }
        }
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.admin.defaultMessage, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
