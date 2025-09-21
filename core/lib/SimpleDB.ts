// Backend: Simple database connection interface
export interface PlayerStats {
    auth: string;
    name: string;
    goals: number;
    assists: number;
    games: number;
    wins: number;
}

export interface MatchEvent {
    id: string;
    type: 'goal' | 'assist';
    playerAuth: string;
    playerName: string;
    timestamp: number;
}

export class SimpleDB {
    private dbUrl: string;
    
    constructor(dbUrl: string) {
        this.dbUrl = dbUrl;
    }
    
    async getPlayer(auth: string): Promise<PlayerStats | null> {
        try {
            const response = await fetch(`${this.dbUrl}/api/v1/player/${auth}`);
            return response.ok ? await response.json() : null;
        } catch {
            return null;
        }
    }
    
    async savePlayer(player: PlayerStats): Promise<boolean> {
        try {
            const response = await fetch(`${this.dbUrl}/api/v1/player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player)
            });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    async getTopScorers(limit: number = 10): Promise<PlayerStats[]> {
        try {
            const response = await fetch(`${this.dbUrl}/api/v1/top/goals?limit=${limit}`);
            return response.ok ? await response.json() : [];
        } catch {
            return [];
        }
    }
    
    async getTopAssisters(limit: number = 10): Promise<PlayerStats[]> {
        try {
            const response = await fetch(`${this.dbUrl}/api/v1/top/assists?limit=${limit}`);
            return response.ok ? await response.json() : [];
        } catch {
            return [];
        }
    }
}