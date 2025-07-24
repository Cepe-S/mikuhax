import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { superAdminLogin } from "../SuperAdmin";

export async function cmdAdmin(byPlayer: PlayerObject, message?: string, submessage?: string): Promise<void> {
    if (message !== undefined) {
        switch (message) {
            case window.gameRoom.config.commands._adminSublogin: {
                if (window.gameRoom.playerList.get(byPlayer.id)!.admin == false) { // only when not yet admin
                    if (submessage !== undefined) { // key check and login
                        if (await superAdminLogin(submessage) === true) { // if login key is matched (same keys as super admin)
                            window.gameRoom._room.setPlayerAdmin(byPlayer.id, true); // set admin
                            window.gameRoom.playerList.get(byPlayer.id)!.admin = true;
                            
                            window.gameRoom._room.sendAnnouncement(LangRes.command.admin.loginSuccess, byPlayer.id, 0x479947, "normal", 2);
                            window.gameRoom.logger.i('admin', `${byPlayer.name}#${byPlayer.id} successfully logged in as admin with the key. (KEY ${submessage})`);
                            
                            window._emitSIOPlayerStatusChangeEvent(byPlayer.id);
                        } else {
                            window.gameRoom.playerList.get(byPlayer.id)!.permissions.malActCount++; // add malicious behaviour count
                            window.gameRoom._room.sendAnnouncement(LangRes.command.admin.loginFail, byPlayer.id, 0xFF7777, "normal", 2);
                            window.gameRoom.logger.i('admin', `${byPlayer.name}#${byPlayer.id} failed login to admin and logged as malicious behaviour. (KEY ${submessage})`);
                        
                            if(window.gameRoom.playerList.get(byPlayer.id)!.permissions.malActCount >= window.gameRoom.config.settings.maliciousBehaviourBanCriterion) {
                                // This player will be permanently banned if it fails to exceed limit.
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
