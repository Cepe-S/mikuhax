import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity()
@Index(['conn']) // Optimizar búsquedas por conn
@Index(['ruid', 'conn']) // Optimizar búsquedas combinadas
export class Connection {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    ruid!: string; // Room UID donde se detectó la conexión

    @Column()
    conn!: string; // Haxball connection ID (único por IP/red)

    @Column({ nullable: true })
    auth!: string; // Haxball auth ID (público del jugador, puede ser null)

    @Column()
    playerName!: string; // Último nombre usado

    @Column({ nullable: true })
    ipAddress!: string; // IP real si está disponible (para uso futuro)

    @Column({ nullable: true })
    country!: string; // País detectado por geolocalización

    @Column({ nullable: true })
    city!: string; // Ciudad

    @Column({ nullable: true })
    isp!: string; // Proveedor de internet

    @Column({ default: false })
    isVpn!: boolean; // Detectado como VPN/Proxy

    @Column({ default: false })
    isSuspicious!: boolean; // Marcado como sospechoso por patrones de spam
}
