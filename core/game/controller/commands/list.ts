import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";

export function cmdList(byPlayer: PlayerObject, message?: string): void {
    if (message !== undefined) {
        var placeholder = {
            whoisResult: LangRes.command.list._ErrorNoOne
        }
        switch (message) {
            case window.gameRoom.config.commands._listSubafk: {
                let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0 && window.gameRoom.playerList.get(player.id)!.permissions.afkmode === true);
                if (players.length >= 1) {
                    placeholder.whoisResult = '💤 '; //init
                    players.forEach((player: PlayerObject) => {
                        const playerData = window.gameRoom.playerList.get(player.id)!;
                        const adminIndicator = player.admin ? '⭐' : '';
                        const superAdminIndicator = playerData.permissions.superadmin ? '👑' : '';
                        placeholder.whoisResult += superAdminIndicator + adminIndicator + player.name + '#' + player.id + ', ';
                    });
                }
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._listSubmute: {
                let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0 && window.gameRoom.playerList.get(player.id)!.permissions.mute === true);
                if (players.length >= 1) {
                    placeholder.whoisResult = '🔇 '; //init
                    players.forEach((player: PlayerObject) => {
                        const playerData = window.gameRoom.playerList.get(player.id)!;
                        const adminIndicator = player.admin ? '⭐' : '';
                        const superAdminIndicator = playerData.permissions.superadmin ? '👑' : '';
                        placeholder.whoisResult += superAdminIndicator + adminIndicator + player.name + '#' + player.id + ', ';
                    });
                }
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._listSubred: {
                let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0 && player.team === TeamID.Red);
                if (players.length >= 1) {
                    placeholder.whoisResult = ''; //init
                    players.forEach((player: PlayerObject) => {
                        const playerData = window.gameRoom.playerList.get(player.id)!;
                        let muteFlag: string = '';
                        let afkFlag: string = '';
                        const adminIndicator = player.admin ? '⭐' : '';
                        const superAdminIndicator = playerData.permissions.superadmin ? '👑' : '';
                        if (playerData.permissions.mute === true) {
                            muteFlag = '🔇';
                        }
                        if (playerData.permissions.afkmode === true) {
                            afkFlag = '💤';
                        }
                        placeholder.whoisResult += superAdminIndicator + adminIndicator + player.name + '#' + player.id + muteFlag + afkFlag + ', ';
                    });
                }
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._listSubblue: {
                let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0 && player.team === TeamID.Blue);
                if (players.length >= 1) {
                    placeholder.whoisResult = ''; //init
                    players.forEach((player: PlayerObject) => {
                        const playerData = window.gameRoom.playerList.get(player.id)!;
                        let muteFlag: string = '';
                        let afkFlag: string = '';
                        const adminIndicator = player.admin ? '⭐' : '';
                        const superAdminIndicator = playerData.permissions.superadmin ? '👑' : '';
                        if (playerData.permissions.mute === true) {
                            muteFlag = '🔇';
                        }
                        if (playerData.permissions.afkmode === true) {
                            afkFlag = '💤';
                        }
                        placeholder.whoisResult += superAdminIndicator + adminIndicator + player.name + '#' + player.id + muteFlag + afkFlag + ', ';
                    });
                }
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._listSubspec: {
                let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0 && player.team === TeamID.Spec);
                if (players.length >= 1) {
                    placeholder.whoisResult = ''; //init
                    players.forEach((player: PlayerObject) => {
                        const playerData = window.gameRoom.playerList.get(player.id)!;
                        let muteFlag: string = '';
                        let afkFlag: string = '';
                        const adminIndicator = player.admin ? '⭐' : '';
                        const superAdminIndicator = playerData.permissions.superadmin ? '👑' : '';
                        if (playerData.permissions.mute === true) {
                            muteFlag = '🔇';
                        }
                        if (playerData.permissions.afkmode === true) {
                            afkFlag = '💤';
                        }
                        placeholder.whoisResult += superAdminIndicator + adminIndicator + player.name + '#' + player.id + muteFlag + afkFlag + ', ';
                    });
                }
                window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            default: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.list._ErrorNoTeam, byPlayer.id, 0xFF7777, "normal", 2);
                break;
            }
        }
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.list._ErrorNoTeam, byPlayer.id, 0xFF7777, "normal", 2);
    }
}
