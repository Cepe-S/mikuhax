export interface MatchEvent {
    matchId: string;
    playerAuth: string;
    playerTeamId: number;
    matchTime: number;
    timestamp: number;
    eventType: 'goal' | 'assist' | 'ownGoal';
}
