import { PlayerObject } from "../../model/GameObject/PlayerObject";

export class PlayerUtils {
    static getPlayerData(playerId: number) {
        return window.gameRoom.playerList.get(playerId);
    }

    static isAdmin(player: PlayerObject): boolean {
        const playerData = this.getPlayerData(player.id);
        return player.admin || (playerData?.permissions.superadmin ?? false);
    }

    static isSuperAdmin(player: PlayerObject): boolean {
        const playerData = this.getPlayerData(player.id);
        return playerData?.permissions.superadmin ?? false;
    }

    static getDisplayName(playerId: number, name: string, isAdmin: boolean, isSuperAdmin: boolean): string {
        const adminIndicator = isAdmin ? '⭐' : '';
        const superAdminIndicator = isSuperAdmin ? '👑' : '';
        return `${superAdminIndicator}${adminIndicator}${name}`;
    }

    static findPlayerByName(targetName: string): { player: PlayerObject; id: number } | null {
        const normalizePlayerName = (name: string) => name.toLowerCase().replace(/[_\s]/g, '');
        const normalizedSearchName = normalizePlayerName(targetName);
        
        for (const [playerId, playerData] of window.gameRoom.playerList) {
            if (normalizePlayerName(playerData.name) === normalizedSearchName) {
                const player = window.gameRoom._room.getPlayerList().find(p => p.id === playerId);
                if (player) return { player, id: playerId };
            }
        }
        return null;
    }

    static parsePlayerId(message: string): number | null {
        if (message.charAt(0) === "#") {
            const targetID = parseInt(message.substr(1), 10);
            return !isNaN(targetID) && window.gameRoom.playerList.has(targetID) ? targetID : null;
        }
        return null;
    }
}