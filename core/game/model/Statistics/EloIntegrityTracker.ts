// Stub EloIntegrityTracker for ELO integrity monitoring
import { PlayerObject } from "../GameObject/PlayerObject";

export class EloIntegrityTracker {
    private static instance: EloIntegrityTracker;

    private constructor() {}

    public static getInstance(): EloIntegrityTracker {
        if (!EloIntegrityTracker.instance) {
            EloIntegrityTracker.instance = new EloIntegrityTracker();
        }
        return EloIntegrityTracker.instance;
    }

    public onPlayerAFK(player: PlayerObject, isGoingAFK: boolean): boolean {
        // Stub implementation - always return false (no violation detected)
        window.gameRoom.logger.i('EloIntegrityTracker', `Player ${player.name} AFK status change: ${isGoingAFK}`);
        return false;
    }

    public checkIntegrity(playerId: number): boolean {
        // Stub implementation - always return true (integrity OK)
        return true;
    }
}