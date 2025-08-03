import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class MatchSummary {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    ruid!: string;

    @Column()
    matchId!: string;

    @Column()
    totalMatchTime!: number;

    @Column("simple-array")
    team1Players!: string[];

    @Column("simple-array")
    team2Players!: string[];

    @Column()
    serverRuid!: string;

    @Column()
    timestamp!: number;
}
