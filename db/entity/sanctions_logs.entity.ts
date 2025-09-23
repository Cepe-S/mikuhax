import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("sanctions_logs")
export class SanctionsLogs {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ruid: string;

    @Column()
    sanctionId: number;

    @Column()
    type: "ban" | "mute" | "unban" | "unmute";

    @Column()
    playerAuth: string;

    @Column()
    playerConn: string;

    @Column()
    playerName: string;

    @Column()
    adminAuth: string;

    @Column()
    adminName: string;

    @Column({ nullable: true })
    reason?: string;

    @Column({ type: "bigint" })
    timestamp: number;

    @Column({ type: "bigint" })
    expire: number;

    @Column()
    wasActive: boolean;
}