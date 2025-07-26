export interface MatchEvent {
    matchId: string;
    playerId: number;
    playerTeamId: number;
    matchTime: number;
    timestamp: number;
    eventType: 'goal' | 'assist' | 'ownGoal';
}
