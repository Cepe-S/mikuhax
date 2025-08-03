import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class MatchEvent {


    @PrimaryColumn()
    ruid!: string;

    @PrimaryColumn()
    matchId!: string;

    @PrimaryColumn()
    playerAuth!: string;

    @PrimaryColumn()
    timestamp!: number;

    @Column()
    playerTeamId?: number;


    @Column()
    matchTime!: number;

    @Column()
    eventType!: string; // 'goal' | 'assist' | 'ownGoal'
}
