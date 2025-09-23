import { getConnection } from "typeorm";
import { SanctionsLogs } from "../entity/sanctions_logs.entity";

export class SanctionsLogsModel {
    private get repository() {
        return getConnection().getRepository(SanctionsLogs);
    }

    async create(data: Partial<SanctionsLogs>): Promise<number> {
        const log = this.repository.create(data);
        const result = await this.repository.save(log);
        return result.id;
    }

    async findByRuid(ruid: string): Promise<SanctionsLogs[]> {
        return await this.repository.find({
            where: { ruid },
            order: { timestamp: 'DESC' }
        });
    }

    async findByPlayerAuth(ruid: string, playerAuth: string): Promise<SanctionsLogs[]> {
        return await this.repository.find({
            where: { ruid, playerAuth },
            order: { timestamp: 'DESC' }
        });
    }
}