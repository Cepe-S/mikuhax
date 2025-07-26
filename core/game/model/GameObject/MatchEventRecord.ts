export interface GoalRecord {
    id: string;
    playerId: number;
    teamId: number;
    matchTime: number;
    timestamp: number;
    gameRoomId: string;
}

export interface AssistRecord {
    id: string;
    playerId: number;
    goalId: string;
    teamId: number;
    matchTime: number;
    timestamp: number;
    gameRoomId: string;
}

export interface OwnGoalRecord {
    id: string;
    playerId: number;
    againstTeamId: number;
    matchTime: number;
    timestamp: number;
    gameRoomId: string;
}

export interface MatchEventStorage {
    goals: GoalRecord[];
    assists: AssistRecord[];
    ownGoals: OwnGoalRecord[];
}
