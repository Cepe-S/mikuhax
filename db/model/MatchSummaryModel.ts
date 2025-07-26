export interface MatchSummaryModel {
    matchId: string;
    totalMatchTime: number;
    team1Players: number[];
    team2Players: number[];
    serverRuid: string;
    timestamp: number;
}
