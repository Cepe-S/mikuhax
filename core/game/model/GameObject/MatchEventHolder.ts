import { TeamID } from "./TeamID";

export interface MatchEventHolder {
    type: 'goal' | 'assist' | 'ownGoal';
    playerId: number;
    playerTeamId: TeamID;
    matchTime: number;
    assistPlayerId?: number;
}