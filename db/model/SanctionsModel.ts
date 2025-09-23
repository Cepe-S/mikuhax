import { getConnection } from "typeorm";
import { Sanctions } from "../entity/sanctions.entity";

export class SanctionsModel {
    private get repository() {
        return getConnection().getRepository(Sanctions);
    }

    async create(data: Partial<Sanctions>): Promise<number> {
        const existing = await this.repository.findOne({
            where: { ruid: data.ruid, auth: data.auth, type: data.type, active: true }
        });

        if (existing) {
            existing.reason = data.reason;
            existing.register = data.register;
            existing.expire = data.expire;
            existing.adminAuth = data.adminAuth;
            existing.adminName = data.adminName;
            await this.repository.save(existing);
            return existing.id;
        }

        const sanction = this.repository.create(data);
        const result = await this.repository.save(sanction);
        return result.id;
    }

    async findActiveByAuth(ruid: string, auth: string, type: string): Promise<Sanctions | null> {
        const now = Date.now();
        return await this.repository.findOne({
            where: { ruid, auth, type: type as any, active: true },
            order: { register: 'DESC' }
        }).then(sanction => {
            if (sanction && sanction.expire !== -1 && sanction.expire <= now) {
                this.deactivate(sanction.id);
                return null;
            }
            return sanction;
        });
    }

    async findByRuidAndType(ruid: string, type: string): Promise<Sanctions[]> {
        return await this.repository.find({
            where: { ruid, type: type as any, active: true },
            order: { register: 'DESC' }
        });
    }

    async deactivate(id: number): Promise<void> {
        await this.repository.update(id, { active: false });
    }
}