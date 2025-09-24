import { TeamID } from "../../model/GameObject/TeamID";
import { BalanceMode } from "./BalanceConfig";

export interface BalanceAction {
    timestamp: number;
    action: string;
    playerId: number;
    playerName: string;
    fromTeam: TeamID;
    toTeam: TeamID;
    reason: string;
    mode: BalanceMode;
    redCount: number;
    blueCount: number;
    queueLength?: number;
}

export class BalanceDebugger {
    private actions: BalanceAction[] = [];
    private maxActions = 200;

    public logAction(
        action: string,
        playerId: number,
        playerName: string,
        fromTeam: TeamID,
        toTeam: TeamID,
        reason: string,
        mode: BalanceMode,
        redCount: number,
        blueCount: number,
        queueLength?: number
    ): void {
        const balanceAction: BalanceAction = {
            timestamp: Date.now(),
            action,
            playerId,
            playerName,
            fromTeam,
            toTeam,
            reason,
            mode,
            redCount,
            blueCount,
            queueLength
        };

        this.actions.unshift(balanceAction);
        
        if (this.actions.length > this.maxActions) {
            this.actions = this.actions.slice(0, this.maxActions);
        }

        window.gameRoom.logger.i('BalanceDebugger', 
            `${action}: ${playerName} (${fromTeam}->${toTeam}) - ${reason} [R:${redCount} B:${blueCount}${queueLength !== undefined ? ` Q:${queueLength}` : ''}]`
        );
    }

    public getActions(): BalanceAction[] {
        return [...this.actions];
    }

    public getRecentActions(count: number = 50): BalanceAction[] {
        return this.actions.slice(0, count);
    }

    public clearActions(): void {
        this.actions = [];
    }

    public getActionsSummary(): { total: number; byMode: Record<string, number>; byAction: Record<string, number> } {
        const summary = {
            total: this.actions.length,
            byMode: {} as Record<string, number>,
            byAction: {} as Record<string, number>
        };

        this.actions.forEach(action => {
            summary.byMode[action.mode] = (summary.byMode[action.mode] || 0) + 1;
            summary.byAction[action.action] = (summary.byAction[action.action] || 0) + 1;
        });

        return summary;
    }
}