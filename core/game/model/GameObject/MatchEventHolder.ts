import { TeamID } from "./TeamID";

export interface MatchEventHolder {
    type: 'goal' | 'assist' | 'ownGoal';
    playerAuth: string;
    playerTeamId: TeamID;
    matchTime: number;
    assistPlayerAuth?: string;
}