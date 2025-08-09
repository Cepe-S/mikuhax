import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("mute_list")
export class MuteList {
    @PrimaryGeneratedColumn()
    uid!: number;

    @Column()
    ruid!: string;

    @Column({ nullable: true })
    auth?: string; // Player auth for persistent identification

    @Column()
    conn!: string; // Connection for backup identification

    @Column()
    reason!: string;

    @Column()
    register!: number; // Registration timestamp

    @Column()
    expire!: number; // Expiration timestamp (-1 for permanent)

    @Column({ nullable: true })
    adminAuth?: string; // Auth of admin who applied the mute

    @Column({ nullable: true })
    adminName?: string; // Name of admin who applied the mute
}
