export interface MatchSummaryModel {
    matchId: string;
    totalMatchTime: number;
    team1Players: string[];
    team2Players: string[];
    serverRuid: string;
    timestamp: number;
}
