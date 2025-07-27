export interface IRepository<T> {
    findAll(ruid: string, pagination?: {start: number, count: number}): Promise<T[]>;
    findSingle(ruid: string, target: string): Promise<T | undefined>;
    addSingle(ruid: string, targetModel: any): Promise<T>;
    updateSingle(ruid: string, target: string, targetModel: any): Promise<T>;
    deleteSingle(ruid: string, target: string): Promise<void>;
}

export interface IMatchEventRepository<T> extends IRepository<T> {
    getTopScorersGlobal?(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
    getTopScorersMonthly?(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
    getTopScorersDaily?(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
    getTopAssistersGlobal?(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
    getTopAssistersMonthly?(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
    getTopAssistersDaily?(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
}