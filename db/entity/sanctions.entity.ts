import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("sanctions")
export class Sanctions {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ruid: string;

    @Column()
    type: "ban" | "mute";

    @Column()
    auth: string;

    @Column()
    conn: string;

    @Column({ nullable: true })
    reason?: string;

    @Column({ type: "bigint" })
    register: number;

    @Column({ type: "bigint" })
    expire: number;

    @Column({ nullable: true })
    adminAuth?: string;

    @Column({ nullable: true })
    adminName?: string;

    @Column({ nullable: true })
    playerName?: string;

    @Column({ default: true })
    active: boolean;
}