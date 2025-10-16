import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { PlayerUtils } from "./PlayerUtils";

export type PermissionLevel = 'admin' | 'superadmin';

export class CommandUtils {
    static checkPermission(player: PlayerObject, level: PermissionLevel): boolean {
        switch (level) {
            case 'admin':
                return PlayerUtils.isAdmin(player);
            case 'superadmin':
                return PlayerUtils.isSuperAdmin(player);
            default:
                return false;
        }
    }

    static sendError(playerId: number, message: string): void {
        window.gameRoom._room.sendAnnouncement(message, playerId, 0xFF7777, "normal", 2);
    }

    static sendSuccess(playerId: number, message: string): void {
        window.gameRoom._room.sendAnnouncement(message, playerId, 0x00AA00, "normal", 1);
    }

    static sendInfo(playerId: number, message: string): void {
        window.gameRoom._room.sendAnnouncement(message, playerId, 0x479947, "normal", 1);
    }

    static parseArgs(fullMessage?: string): string[] {
        return fullMessage ? fullMessage.split(" ") : [];
    }

    static requirePermission(player: PlayerObject, level: PermissionLevel): boolean {
        if (!this.checkPermission(player, level)) {
            const levelText = level === 'superadmin' ? 'superadministradores' : 'administradores';
            this.sendError(player.id, `❌ Solo los ${levelText} pueden usar este comando.`);
            return false;
        }
        return true;
    }
}