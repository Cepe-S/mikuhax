import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity()
@Index(["ruid", "rating"])
@Index(["ruid", "auth"])
export class Player {
    @PrimaryGeneratedColumn()
    uid!: number;

    @Column()
    @Index()
    ruid!: string;

    @Column()
    @Index()
    auth!: string; 

    @Column()
    conn!: string; 

    @Column()
    name!: string;

    @Column()
    @Index()
    rating!: number; 

    @Column()
    totals!: number; 

    @Column()
    disconns!: number; 

    @Column()
    wins!: number; 

    @Column()
    goals!: number; 

    @Column()
    assists!: number;

    @Column()
    ogs!: number;

    @Column()
    losePoints!: number; 

    @Column()
    balltouch!: number; 

    @Column()
    passed!: number; 

    @Column()
    mute!: boolean; 

    @Column()
    muteExpire!: number; 

    @Column()
    rejoinCount!: number; 

    @Column()
    joinDate!: number;

    @Column()
    leftDate!: number; 

    @Column()
    malActCount!: number; 
}