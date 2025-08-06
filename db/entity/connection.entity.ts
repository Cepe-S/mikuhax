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
    region!: string; // Región/estado

    @Column({ nullable: true })
    city!: string; // Ciudad

    @Column({ nullable: true, type: 'real' })
    latitude!: number; // Latitud

    @Column({ nullable: true, type: 'real' })
    longitude!: number; // Longitud

    @Column({ nullable: true })
    isp!: string; // Proveedor de internet

    @Column({ nullable: true })
    timezone!: string; // Zona horaria

    @Column({ default: false })
    isVpn!: boolean; // Detectado como VPN/Proxy

    @Column({ default: false })
    isSuspicious!: boolean; // Marcado como sospechoso por patrones de spam

    @Column({ default: 0 })
    spamScore!: number; // Puntuación de spam

    @Column({ default: 0 })
    joinCount!: number; // Número de conexiones

    @Column({ default: 0 })
    kickCount!: number; // Número de kicks recibidos

    @Column({ default: 0 })
    banCount!: number; // Número de bans recibidos

    @Column({ nullable: true, type: 'text' })
    aliases!: string; // Aliases usados (JSON string)

    @Column({ nullable: true, type: 'text' })
    spamPatterns!: string; // Patrones de spam detectados (JSON string)

    @Column({ nullable: true, type: 'datetime' })
    firstSeen!: Date; // Primera vez visto

    @Column({ nullable: true, type: 'datetime' })
    lastSeen!: Date; // Última vez visto

    @Column({ nullable: true, type: 'datetime' })
    lastActivity!: Date; // Última actividad
}
