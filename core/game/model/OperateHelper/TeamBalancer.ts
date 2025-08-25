import { PlayerObject } from "../GameObject/PlayerObject";
import { TeamID } from "../GameObject/TeamID";

interface BalancedPlayer {
    id: number;
    name: string;
    rating: number;
    subteam?: string;
    assignedTeam: TeamID;
}

interface TeamBuffer {
    red: BalancedPlayer[];
    blue: BalancedPlayer[];
}

export class TeamBalancer {
    private static instance: TeamBalancer;
    
    static getInstance(): TeamBalancer {
        if (!TeamBalancer.instance) {
            TeamBalancer.instance = new TeamBalancer();
        }
        return TeamBalancer.instance;
    }

    /**
     * 1. Distribuye subteams entre equipos manteniendo cohesión
     */
    private distributeSubteams(players: BalancedPlayer[], teamBuffer: TeamBuffer): void {
        const subteamGroups = this.groupPlayersBySubteam(players);
        const requiredPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;
        
        // Ordenar subteams por tamaño (más grandes primero)
        const sortedSubteams = Array.from(subteamGroups.entries())
            .filter(([name]) => name !== 'solo')
            .sort(([,a], [,b]) => b.length - a.length);

        for (const [subteamName, members] of sortedSubteams) {
            const redSpace = requiredPerTeam - teamBuffer.red.length;
            const blueSpace = requiredPerTeam - teamBuffer.blue.length;
            
            if (members.length <= redSpace && members.length <= blueSpace) {
                // Asignar al equipo con menos jugadores
                const targetTeam = teamBuffer.red.length <= teamBuffer.blue.length ? TeamID.Red : TeamID.Blue;
                this.assignPlayersToTeam(members, targetTeam, teamBuffer);
            } else if (members.length <= redSpace) {
                this.assignPlayersToTeam(members, TeamID.Red, teamBuffer);
            } else if (members.length <= blueSpace) {
                this.assignPlayersToTeam(members, TeamID.Blue, teamBuffer);
            }
        }
    }

    /**
     * 2. Agrega jugadores sin subteam balanceando por cantidad y rating
     */
    private distributeSoloPlayers(players: BalancedPlayer[], teamBuffer: TeamBuffer): void {
        const soloPlayers = players.filter(p => !p.subteam);
        const requiredPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;
        
        // Ordenar jugadores por rating para mejor distribución
        soloPlayers.sort((a, b) => b.rating - a.rating);
        
        for (const player of soloPlayers) {
            const redSpace = requiredPerTeam - teamBuffer.red.length;
            const blueSpace = requiredPerTeam - teamBuffer.blue.length;
            
            if (redSpace <= 0 && blueSpace <= 0) break;
            
            let targetTeam: TeamID;
            if (redSpace > 0 && blueSpace > 0) {
                // Ambos equipos tienen espacio - priorizar balance de jugadores
                if (teamBuffer.red.length < teamBuffer.blue.length) {
                    targetTeam = TeamID.Red;
                } else if (teamBuffer.blue.length < teamBuffer.red.length) {
                    targetTeam = TeamID.Blue;
                } else {
                    // Mismo número - elegir por rating más bajo para mejor balance
                    const redRating = this.calculateTeamRating(teamBuffer.red);
                    const blueRating = this.calculateTeamRating(teamBuffer.blue);
                    targetTeam = redRating <= blueRating ? TeamID.Red : TeamID.Blue;
                }
            } else {
                targetTeam = redSpace > 0 ? TeamID.Red : TeamID.Blue;
            }
            
            this.assignPlayersToTeam([player], targetTeam, teamBuffer);
        }
    }

    /**
     * 3. Balancea por rating sin romper subteams
     */
    private balanceByRating(teamBuffer: TeamBuffer): void {
        const redRating = this.calculateTeamRating(teamBuffer.red);
        const blueRating = this.calculateTeamRating(teamBuffer.blue);
        const ratingDiff = Math.abs(redRating - blueRating);
        
        // Solo balancear si la diferencia es significativa (>100 puntos)
        if (ratingDiff < 100) return;
        
        const strongerTeam = redRating > blueRating ? teamBuffer.red : teamBuffer.blue;
        const weakerTeam = redRating > blueRating ? teamBuffer.blue : teamBuffer.red;
        const strongerTeamId = redRating > blueRating ? TeamID.Red : TeamID.Blue;
        const weakerTeamId = redRating > blueRating ? TeamID.Blue : TeamID.Red;
        
        // Buscar jugador sin subteam del equipo más fuerte para intercambiar
        const soloPlayersInStronger = strongerTeam.filter(p => !p.subteam);
        if (soloPlayersInStronger.length === 0) return;
        
        // Encontrar el mejor intercambio
        let bestPlayer: BalancedPlayer | null = null;
        let bestImprovement = 0;
        
        for (const player of soloPlayersInStronger) {
            const newStrongerRating = this.calculateTeamRating(strongerTeam.filter(p => p.id !== player.id));
            const newWeakerRating = this.calculateTeamRating([...weakerTeam, player]);
            const newDiff = Math.abs(newStrongerRating - newWeakerRating);
            const improvement = ratingDiff - newDiff;
            
            if (improvement > bestImprovement) {
                bestImprovement = improvement;
                bestPlayer = player;
            }
        }
        
        // Realizar el intercambio si mejora el balance
        if (bestPlayer && bestImprovement > 20) {
            this.movePlayerBetweenTeams(bestPlayer, strongerTeamId, weakerTeamId, teamBuffer);
        }
    }

    /**
     * 4. Aplica los cambios moviendo jugadores en Haxball
     */
    private applyTeamChanges(teamBuffer: TeamBuffer): void {
        const currentPlayers = window.gameRoom._room.getPlayerList()
            .filter((p: PlayerObject) => p.id !== 0);
        
        for (const player of teamBuffer.red) {
            const currentPlayer = currentPlayers.find(p => p.id === player.id);
            if (currentPlayer && currentPlayer.team !== TeamID.Red) {
                window.gameRoom._room.setPlayerTeam(player.id, TeamID.Red);
                window.gameRoom.logger.i('TeamBalancer', `Moved ${player.name}#${player.id} to Red team`);
            }
        }
        
        for (const player of teamBuffer.blue) {
            const currentPlayer = currentPlayers.find(p => p.id === player.id);
            if (currentPlayer && currentPlayer.team !== TeamID.Blue) {
                window.gameRoom._room.setPlayerTeam(player.id, TeamID.Blue);
                window.gameRoom.logger.i('TeamBalancer', `Moved ${player.name}#${player.id} to Blue team`);
            }
        }
    }

    /**
     * Función principal de balanceo
     */
    public balanceTeams(): void {
        const players = this.getPlayersToBalance();
        if (players.length < 2) return;
        
        // Verificar si hay subteams divididos primero
        const hasSubteamsDivided = this.hasSubteamsDivided(players);
        if (!hasSubteamsDivided && !this.shouldBalance(players)) {
            window.gameRoom.logger.i('TeamBalancer', 'No balancing needed - teams are already optimal and no subteams divided');
            return;
        }
        
        const teamBuffer: TeamBuffer = { red: [], blue: [] };
        
        // Preservar jugadores ya en equipos si están balanceados
        const currentPlayers = window.gameRoom._room.getPlayerList().filter(p => p.id !== 0);
        const redCount = currentPlayers.filter(p => p.team === TeamID.Red).length;
        const blueCount = currentPlayers.filter(p => p.team === TeamID.Blue).length;
        const specPlayers = players.filter(p => {
            const currentPlayer = currentPlayers.find(cp => cp.id === p.id);
            return currentPlayer && currentPlayer.team === TeamID.Spec;
        });
        
        // Si solo hay jugadores en spec, los equipos están balanceados y no hay subteams divididos
        if (!hasSubteamsDivided && specPlayers.length > 0 && Math.abs(redCount - blueCount) <= 1) {
            this.assignSpecPlayersOnly(specPlayers);
            return;
        }
        
        if (hasSubteamsDivided) {
            const isGameStart = !window.gameRoom.isGamingNow;
            window.gameRoom.logger.i('TeamBalancer', `Subteams divididos detectados${isGameStart ? ' al inicio del juego' : ' durante el juego'} - priorizando unidad de subteams`);
            // Siempre priorizar mantener subteams juntos cuando están divididos
            this.balanceWithSubteamPriority(players, teamBuffer);
        } else {
            // No hay subteams divididos, usar balanceo normal
            // 1. Distribuir subteams
            this.distributeSubteams(players, teamBuffer);
            
            // 2. Distribuir jugadores solo
            this.distributeSoloPlayers(players, teamBuffer);
            
            // 3. Balancear por rating solo si es necesario
            this.balanceByRating(teamBuffer);
        }
        
        // 4. Aplicar cambios
        this.applyTeamChanges(teamBuffer);
        
        this.logBalanceResult(teamBuffer);
    }

    // Funciones auxiliares
    private getPlayersToBalance(): BalancedPlayer[] {
        return window.gameRoom._room.getPlayerList()
            .filter((p: PlayerObject) => p.id !== 0 && 
                    window.gameRoom.playerList.has(p.id) && 
                    !window.gameRoom.playerList.get(p.id)!.permissions.afkmode)
            .map(p => ({
                id: p.id,
                name: p.name,
                rating: window.gameRoom.playerList.get(p.id)!.stats.rating,
                subteam: this.getPlayerSubteamName(p.name),
                assignedTeam: TeamID.Spec
            }));
    }

    private groupPlayersBySubteam(players: BalancedPlayer[]): Map<string, BalancedPlayer[]> {
        const groups = new Map<string, BalancedPlayer[]>();
        
        for (const player of players) {
            const subteamName = player.subteam || 'solo';
            if (!groups.has(subteamName)) {
                groups.set(subteamName, []);
            }
            groups.get(subteamName)!.push(player);
        }
        
        return groups;
    }

    private getPlayerSubteam(playerName: string): any {
        try {
            if (typeof (global as any).getPlayerSubteam === 'function' && 
                typeof (global as any).isTeamupEnabled === 'function' && 
                (global as any).isTeamupEnabled()) {
                return (global as any).getPlayerSubteam(playerName);
            }
        } catch (e) {
            // Ignore errors
        }
        return null;
    }
    
    private getPlayerSubteamName(playerName: string): string | undefined {
        const subteam = this.getPlayerSubteam(playerName);
        return subteam?.name;
    }

    private assignPlayersToTeam(players: BalancedPlayer[], team: TeamID, teamBuffer: TeamBuffer): void {
        const targetArray = team === TeamID.Red ? teamBuffer.red : teamBuffer.blue;
        for (const player of players) {
            player.assignedTeam = team;
            targetArray.push(player);
        }
    }

    private movePlayerBetweenTeams(player: BalancedPlayer, fromTeam: TeamID, toTeam: TeamID, teamBuffer: TeamBuffer): void {
        const fromArray = fromTeam === TeamID.Red ? teamBuffer.red : teamBuffer.blue;
        const toArray = toTeam === TeamID.Red ? teamBuffer.red : teamBuffer.blue;
        
        const index = fromArray.findIndex(p => p.id === player.id);
        if (index !== -1) {
            fromArray.splice(index, 1);
            player.assignedTeam = toTeam;
            toArray.push(player);
        }
    }

    private calculateTeamRating(team: BalancedPlayer[]): number {
        return team.reduce((sum, p) => sum + p.rating, 0);
    }

    /**
     * Balancea específicamente cuando hay desbalance de jugadores respetando subteams
     */
    public balanceAfterPlayerLeave(): void {
        const currentPlayers = window.gameRoom._room.getPlayerList().filter(p => p.id !== 0);
        const redCount = currentPlayers.filter(p => p.team === TeamID.Red).length;
        const blueCount = currentPlayers.filter(p => p.team === TeamID.Blue).length;
        const specPlayers = currentPlayers.filter(p => p.team === TeamID.Spec && 
            window.gameRoom.playerList.has(p.id) && 
            !window.gameRoom.playerList.get(p.id)!.permissions.afkmode);
        
        // Solo balancear si hay desbalance significativo (diferencia > 1)
        const imbalance = Math.abs(redCount - blueCount);
        if (imbalance <= 1) {
            window.gameRoom.logger.i('TeamBalancer', `No balancing needed after player leave - teams balanced (Red: ${redCount}, Blue: ${blueCount})`);
            return;
        }
        
        window.gameRoom.logger.i('TeamBalancer', `Team imbalance detected after player leave (Red: ${redCount}, Blue: ${blueCount}, Spec: ${specPlayers.length})`);
        
        // Estrategia conservadora: solo mover de spec a equipos, nunca entre equipos
        if (specPlayers.length > 0) {
            const targetTeam = redCount < blueCount ? TeamID.Red : TeamID.Blue;
            const neededPlayers = Math.ceil(imbalance / 2); // Cuántos jugadores necesitamos mover
            
            // Buscar jugadores sin subteam primero (más fáciles de mover)
            const soloSpecPlayers = specPlayers.filter(p => !this.getPlayerSubteam(p.name));
            
            if (soloSpecPlayers.length >= neededPlayers) {
                // Mover solo los jugadores necesarios sin subteam
                const playersToMove = soloSpecPlayers
                    .sort((a, b) => window.gameRoom.playerList.get(b.id)!.stats.rating - window.gameRoom.playerList.get(a.id)!.stats.rating)
                    .slice(0, neededPlayers);
                
                for (const player of playersToMove) {
                    window.gameRoom._room.setPlayerTeam(player.id, targetTeam);
                    window.gameRoom.logger.i('TeamBalancer', 
                        `Moved solo player ${player.name}#${player.id} from spec to ${targetTeam === TeamID.Red ? 'Red' : 'Blue'} team`);
                }
            } else {
                // Si no hay suficientes jugadores solo, mover todos los solo disponibles
                for (const player of soloSpecPlayers) {
                    window.gameRoom._room.setPlayerTeam(player.id, targetTeam);
                    window.gameRoom.logger.i('TeamBalancer', 
                        `Moved solo player ${player.name}#${player.id} from spec to ${targetTeam === TeamID.Red ? 'Red' : 'Blue'} team`);
                }
                
                // Solo si aún hay desbalance significativo después de mover jugadores solo
                const newRedCount = targetTeam === TeamID.Red ? redCount + soloSpecPlayers.length : redCount;
                const newBlueCount = targetTeam === TeamID.Blue ? blueCount + soloSpecPlayers.length : blueCount;
                const remainingImbalance = Math.abs(newRedCount - newBlueCount);
                
                if (remainingImbalance > 1) {
                    window.gameRoom.logger.i('TeamBalancer', 'Significant imbalance remains, using full balance with subteams');
                    this.balanceTeams();
                }
            }
        } else {
            // No hay jugadores en spec - balancear si el desbalance es >= 2
            if (imbalance >= 2) {
                window.gameRoom.logger.i('TeamBalancer', 'Imbalance detected with no spec players, using full balance');
                this.balanceTeams();
            } else {
                window.gameRoom.logger.i('TeamBalancer', 'Minor imbalance with no spec players, waiting for new players');
            }
        }
    }

    /**
     * Verifica si es necesario balancear los equipos
     */
    private shouldBalance(players: BalancedPlayer[]): boolean {
        const currentPlayers = window.gameRoom._room.getPlayerList().filter(p => p.id !== 0);
        const redCount = currentPlayers.filter(p => p.team === TeamID.Red).length;
        const blueCount = currentPlayers.filter(p => p.team === TeamID.Blue).length;
        const specCount = currentPlayers.filter(p => p.team === TeamID.Spec && 
            window.gameRoom.playerList.has(p.id) && 
            !window.gameRoom.playerList.get(p.id)!.permissions.afkmode).length;
        
        // Solo balancear si hay jugadores activos en spec
        if (specCount > 0) return true;
        
        // Solo balancear si hay desbalance significativo (diferencia > 1)
        if (Math.abs(redCount - blueCount) > 1) return true;
        
        // No balancear si los equipos están equilibrados
        return false;
    }

    /**
     * Asigna solo jugadores en spec sin mover jugadores ya en equipos
     */
    private assignSpecPlayersOnly(specPlayers: BalancedPlayer[]): void {
        const currentPlayers = window.gameRoom._room.getPlayerList().filter(p => p.id !== 0);
        let redCount = currentPlayers.filter(p => p.team === TeamID.Red).length;
        let blueCount = currentPlayers.filter(p => p.team === TeamID.Blue).length;
        
        // Agrupar jugadores spec por subteam
        const subteamGroups = this.groupPlayersBySubteam(specPlayers);
        const requiredPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;
        
        // Asignar subteams completos primero
        for (const [subteamName, members] of subteamGroups.entries()) {
            if (subteamName === 'solo') continue;
            
            const redSpace = requiredPerTeam - redCount;
            const blueSpace = requiredPerTeam - blueCount;
            
            if (members.length <= redSpace && members.length <= blueSpace) {
                const targetTeam = redCount <= blueCount ? TeamID.Red : TeamID.Blue;
                this.movePlayersToTeam(members, targetTeam);
                if (targetTeam === TeamID.Red) redCount += members.length;
                else blueCount += members.length;
            } else if (members.length <= redSpace) {
                this.movePlayersToTeam(members, TeamID.Red);
                redCount += members.length;
            } else if (members.length <= blueSpace) {
                this.movePlayersToTeam(members, TeamID.Blue);
                blueCount += members.length;
            }
        }
        
        // Asignar jugadores solo
        const soloPlayers = subteamGroups.get('solo') || [];
        for (const player of soloPlayers) {
            const redSpace = requiredPerTeam - redCount;
            const blueSpace = requiredPerTeam - blueCount;
            
            if (redSpace <= 0 && blueSpace <= 0) break;
            
            const targetTeam = (redSpace > 0 && blueSpace > 0) 
                ? (redCount <= blueCount ? TeamID.Red : TeamID.Blue)
                : (redSpace > 0 ? TeamID.Red : TeamID.Blue);
            
            this.movePlayersToTeam([player], targetTeam);
            if (targetTeam === TeamID.Red) redCount++;
            else blueCount++;
        }
        
        window.gameRoom.logger.i('TeamBalancer', 
            `Assigned spec players only - Red: ${redCount}, Blue: ${blueCount}`);
    }
    
    private movePlayersToTeam(players: BalancedPlayer[], team: TeamID): void {
        for (const player of players) {
            window.gameRoom._room.setPlayerTeam(player.id, team);
            window.gameRoom.logger.i('TeamBalancer', 
                `Moved ${player.name}#${player.id} to ${team === TeamID.Red ? 'Red' : 'Blue'} team`);
        }
    }

    /**
     * Verifica si hay subteams divididos entre equipos
     */
    private hasSubteamsDivided(players: BalancedPlayer[]): boolean {
        const subteamGroups = this.groupPlayersBySubteam(players);
        const currentPlayers = window.gameRoom._room.getPlayerList().filter(p => p.id !== 0);
        
        for (const [subteamName, members] of subteamGroups.entries()) {
            if (subteamName === 'solo' || members.length < 2) continue;
            
            const redMembers = members.filter(m => {
                const currentPlayer = currentPlayers.find(cp => cp.id === m.id);
                return currentPlayer && currentPlayer.team === TeamID.Red;
            });
            
            const blueMembers = members.filter(m => {
                const currentPlayer = currentPlayers.find(cp => cp.id === m.id);
                return currentPlayer && currentPlayer.team === TeamID.Blue;
            });
            
            // Si un subteam tiene miembros en ambos equipos, está dividido
            if (redMembers.length > 0 && blueMembers.length > 0) {
                window.gameRoom.logger.i('TeamBalancer', `Subteam dividido encontrado: ${subteamName} (🔴${redMembers.length} 🔵${blueMembers.length})`);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Balanceo con prioridad en mantener subteams unidos
     */
    private balanceWithSubteamPriority(players: BalancedPlayer[], teamBuffer: TeamBuffer): void {
        const subteamGroups = this.groupPlayersBySubteam(players);
        const requiredPerTeam = window.gameRoom.config.rules.requisite.eachTeamPlayers;
        const currentPlayers = window.gameRoom._room.getPlayerList().filter(p => p.id !== 0);
        
        // Primero, identificar subteams que están divididos y reagruparlos
        const dividedSubteams: string[] = [];
        for (const [subteamName, members] of subteamGroups.entries()) {
            if (subteamName === 'solo' || members.length < 2) continue;
            
            const redMembers = members.filter(m => {
                const currentPlayer = currentPlayers.find(cp => cp.id === m.id);
                return currentPlayer && currentPlayer.team === TeamID.Red;
            });
            
            const blueMembers = members.filter(m => {
                const currentPlayer = currentPlayers.find(cp => cp.id === m.id);
                return currentPlayer && currentPlayer.team === TeamID.Blue;
            });
            
            if (redMembers.length > 0 && blueMembers.length > 0) {
                dividedSubteams.push(subteamName);
                window.gameRoom.logger.i('TeamBalancer', `Subteam dividido detectado: ${subteamName} (🔴${redMembers.length} 🔵${blueMembers.length})`);
            }
        }
        
        // Asignar todos los subteams completos, priorizando los divididos
        const sortedSubteams = Array.from(subteamGroups.entries())
            .filter(([name]) => name !== 'solo')
            .sort(([nameA], [nameB]) => {
                const aIsDivided = dividedSubteams.includes(nameA) ? 1 : 0;
                const bIsDivided = dividedSubteams.includes(nameB) ? 1 : 0;
                // Primero los divididos, luego por tamaño
                if (aIsDivided !== bIsDivided) return bIsDivided - aIsDivided;
                return subteamGroups.get(nameB)!.length - subteamGroups.get(nameA)!.length;
            });
        
        for (const [subteamName, members] of sortedSubteams) {
            const redSpace = requiredPerTeam - teamBuffer.red.length;
            const blueSpace = requiredPerTeam - teamBuffer.blue.length;
            
            if (members.length <= redSpace && members.length <= blueSpace) {
                // Para subteams divididos, elegir el equipo que tenga más miembros actuales
                let targetTeam: TeamID;
                if (dividedSubteams.includes(subteamName)) {
                    const redMembers = members.filter(m => {
                        const currentPlayer = currentPlayers.find(cp => cp.id === m.id);
                        return currentPlayer && currentPlayer.team === TeamID.Red;
                    }).length;
                    
                    const blueMembers = members.filter(m => {
                        const currentPlayer = currentPlayers.find(cp => cp.id === m.id);
                        return currentPlayer && currentPlayer.team === TeamID.Blue;
                    }).length;
                    
                    targetTeam = redMembers >= blueMembers ? TeamID.Red : TeamID.Blue;
                    window.gameRoom.logger.i('TeamBalancer', `Reagrupando subteam dividido ${subteamName} en equipo ${targetTeam === TeamID.Red ? 'Rojo' : 'Azul'}`);
                } else {
                    // Para subteams no divididos, balancear normalmente
                    if (teamBuffer.red.length < teamBuffer.blue.length) {
                        targetTeam = TeamID.Red;
                    } else if (teamBuffer.blue.length < teamBuffer.red.length) {
                        targetTeam = TeamID.Blue;
                    } else {
                        const redRating = this.calculateTeamRating(teamBuffer.red);
                        const blueRating = this.calculateTeamRating(teamBuffer.blue);
                        targetTeam = redRating <= blueRating ? TeamID.Red : TeamID.Blue;
                    }
                }
                this.assignPlayersToTeam(members, targetTeam, teamBuffer);
            } else if (members.length <= redSpace) {
                this.assignPlayersToTeam(members, TeamID.Red, teamBuffer);
            } else if (members.length <= blueSpace) {
                this.assignPlayersToTeam(members, TeamID.Blue, teamBuffer);
            }
        }
        
        // Luego, distribuir jugadores solo
        this.distributeSoloPlayers(players, teamBuffer);
    }

    private logBalanceResult(teamBuffer: TeamBuffer): void {
        const redRating = this.calculateTeamRating(teamBuffer.red);
        const blueRating = this.calculateTeamRating(teamBuffer.blue);
        
        // Verificar estado de subteams
        const subteamStatus = this.getSubteamStatus(teamBuffer);
        
        window.gameRoom.logger.i('TeamBalancer', 
            `Balance complete - Red: ${teamBuffer.red.length} players (${redRating} ELO), ` +
            `Blue: ${teamBuffer.blue.length} players (${blueRating} ELO), ` +
            `Difference: ${Math.abs(redRating - blueRating)} ELO`);
            
        if (subteamStatus) {
            window.gameRoom.logger.i('TeamBalancer', subteamStatus);
        }
    }
    
    /**
     * Obtiene el estado de los subteams después del balanceo
     */
    private getSubteamStatus(teamBuffer: TeamBuffer): string {
        const allPlayers = [...teamBuffer.red, ...teamBuffer.blue];
        const subteamGroups = this.groupPlayersBySubteam(allPlayers);
        const dividedSubteams: string[] = [];
        const unitedSubteams: string[] = [];
        
        for (const [subteamName, members] of subteamGroups.entries()) {
            if (subteamName === 'solo' || members.length < 2) continue;
            
            const redMembers = members.filter(m => m.assignedTeam === TeamID.Red);
            const blueMembers = members.filter(m => m.assignedTeam === TeamID.Blue);
            
            if (redMembers.length > 0 && blueMembers.length > 0) {
                dividedSubteams.push(`${subteamName}(🔴${redMembers.length}🔵${blueMembers.length})`);
            } else {
                const teamColor = redMembers.length > 0 ? '🔴' : '🔵';
                unitedSubteams.push(`${subteamName}${teamColor}${members.length}`);
            }
        }
        
        let status = '';
        if (unitedSubteams.length > 0) {
            status += `✅ Subteams unidos: ${unitedSubteams.join(', ')}`;
        }
        if (dividedSubteams.length > 0) {
            if (status) status += ', ';
            status += `⚠️ Subteams divididos: ${dividedSubteams.join(', ')}`;
        }
        
        return status;
    }
}