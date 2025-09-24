export enum BalanceMode {
    JT = "jt",
    PRO = "pro"
}

export interface BalanceConfig {
    mode: BalanceMode;
    maxPlayersPerTeam: number;
    enabled: boolean;
}

export const DEFAULT_BALANCE_CONFIG: BalanceConfig = {
    mode: BalanceMode.JT,
    maxPlayersPerTeam: 4,
    enabled: true
};