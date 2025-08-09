export interface IRepository<T> {
    findAll(ruid: string, pagination?: {start: number, count: number}): Promise<T[]>;
    findSingle(ruid: string, target: string): Promise<T | undefined>;
    addSingle(ruid: string, targetModel: any): Promise<T>;
    updateSingle(ruid: string, target: string, targetModel: any): Promise<T>;
    deleteSingle(ruid: string, target: string): Promise<void>;
}

export interface IMatchEventRepository<T> extends IRepository<T> {
    getTopByRange?(ruid: string, eventType: 'goal' | 'assist', from?: number, to?: number, limit?: number): Promise<{playerAuth: string, playerName: string, count: number}[]>;
}