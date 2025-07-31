// Import JSON data directly
import * as realTeamsData from './real_teams.json';
import * as realMatchesData from './real_matches.json';

export interface TeamColors {
    angle: number;
    textColour: number;
    teamColour1: number;
    teamColour2: number | null;
    teamColour3: number | null;
}

export interface TeamKit {
    tit?: TeamColors | null;
    alt?: TeamColors | null;
}

interface MatchData {
    [league: string]: {
        name: string;
        rate: number;
        classics: [string, string][][];
    };
}

class RealTeamsLoader {
    private static instance: RealTeamsLoader;
    private data: { [teamName: string]: TeamKit };
    private matchesData: MatchData;
    private validMatches: [string, string][][];
    private validated = false;

    private constructor() {
        this.loadAndValidateData();
    }

    private loadAndValidateData(): void {
        try {
            // Load data from imported JSON files
            if (!realTeamsData || typeof realTeamsData !== 'object' || Object.keys(realTeamsData).length === 0) {
                console.error('realTeamsData is empty or invalid:', realTeamsData);
                throw new Error('Failed to load team data from real_teams.json');
            }
            
            if (!realMatchesData || typeof realMatchesData !== 'object' || Object.keys(realMatchesData).length === 0) {
                console.error('realMatchesData is empty or invalid:', realMatchesData);
                throw new Error('Failed to load matches data from real_matches.json');
            }
            
            this.data = realTeamsData as any as { [teamName: string]: TeamKit };
            this.matchesData = realMatchesData as any as MatchData;
            
            const allTeams = Object.keys(this.data);
            console.log(`Successfully loaded ${allTeams.length} teams from real_teams.json`);
            console.log(`Successfully loaded ${Object.keys(this.matchesData).length} leagues from real_matches.json`);

            // Validate all teams in matches exist in real_teams.json
            const errors: string[] = [];
            const teamsInMatches = new Set<string>();

            if (this.matchesData && typeof this.matchesData === 'object') {
                Object.entries(this.matchesData).forEach(([league, leagueData]) => {
                    if (leagueData && leagueData.classics && Array.isArray(leagueData.classics)) {
                        leagueData.classics.forEach((match, matchIndex) => {
                            if (Array.isArray(match) && match.length === 2) {
                                match.forEach(([teamName, kitType]) => {
                                    if (teamName && kitType) {
                                        teamsInMatches.add(teamName);
                                        
                                        if (!allTeams.includes(teamName)) {
                                            errors.push(`Team "${teamName}" in ${league} match ${matchIndex} not found in real_teams.json`);
                                        } else {
                                            const team = this.data[teamName];
                                            const kit = team?.[kitType as 'tit' | 'alt'];
                                            if (!kit) {
                                                // If 'alt' kit is missing, try to use 'tit' kit as fallback
                                                if (kitType === 'alt' && team?.tit) {
                                                    console.warn(`Team "${teamName}" missing "alt" kit, will use "tit" kit as fallback`);
                                                } else {
                                                    errors.push(`Team "${teamName}" missing "${kitType}" kit in real_teams.json (used in ${league} match ${matchIndex})`);
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }

            if (errors.length > 0) {
                const errorMessage = `JERSEY VALIDATION FAILED:\n${errors.join('\n')}`;
                console.error(errorMessage);
                console.error('\n❌ CRITICAL ERROR: Jersey validation failed!');
                process.exit(1);
            }

            // Pre-calculate valid matches
            this.validMatches = [];
            if (this.matchesData && typeof this.matchesData === 'object') {
                Object.values(this.matchesData).forEach(league => {
                    if (league && league.classics && Array.isArray(league.classics)) {
                        league.classics.forEach(match => {
                            if (Array.isArray(match) && match.length === 2) {
                                const [blueTeam, redTeam] = match;
                                if (blueTeam && redTeam && Array.isArray(blueTeam) && Array.isArray(redTeam)) {
                                    const blueKit = blueTeam[1] as 'tit' | 'alt';
                                    const redKit = redTeam[1] as 'tit' | 'alt';
                                    
                                    const blueColors = this.data[blueTeam[0]]?.[blueKit] || this.data[blueTeam[0]]?.tit;
                                    const redColors = this.data[redTeam[0]]?.[redKit] || this.data[redTeam[0]]?.tit;
                                    
                                    if (blueColors && redColors) {
                                        this.validMatches.push(match);
                                    }
                                }
                            }
                        });
                    }
                });
            }

            console.log(`Validation successful: ${teamsInMatches.size} teams used in matches, ${this.validMatches.length} valid matches loaded`);
            this.validated = true;
        } catch (error) {
            console.error('CRITICAL: Failed to load or validate team data:', error);
            throw error;
        }
    }

    public static getInstance(): RealTeamsLoader {
        if (!RealTeamsLoader.instance) {
            RealTeamsLoader.instance = new RealTeamsLoader();
        }
        return RealTeamsLoader.instance;
    }

    public getTeamColors(teamName: string, kitType: 'tit' | 'alt'): TeamColors | null {
        const team = this.data[teamName];
        if (!team) return null;
        
        // Return requested kit, or fallback to 'tit' if 'alt' doesn't exist
        return team[kitType] || team.tit || null;
    }

    public getAllTeamNames(): string[] {
        return Object.keys(this.data);
    }

    public getTeam(teamName: string): TeamKit | null {
        return this.data[teamName] || null;
    }

    public getRandomMatch(): { blue: TeamColors & { name: string }, red: TeamColors & { name: string } } | null {
        if (!this.validated) {
            console.error('Team data not validated yet');
            return null;
        }
        
        if (this.validMatches.length === 0) {
            console.warn('No valid matches available');
            return null;
        }
        
        const randomMatch = this.validMatches[Math.floor(Math.random() * this.validMatches.length)];
        const [blueTeam, redTeam] = randomMatch;
        
        if (!blueTeam || !redTeam || !Array.isArray(blueTeam) || !Array.isArray(redTeam)) {
            console.error('Invalid match format:', randomMatch);
            return null;
        }
        
        const blueKit = blueTeam[1] as 'tit' | 'alt';
        const redKit = redTeam[1] as 'tit' | 'alt';
        
        const blueColors = this.data[blueTeam[0]]?.[blueKit] || this.data[blueTeam[0]]?.tit;
        const redColors = this.data[redTeam[0]]?.[redKit] || this.data[redTeam[0]]?.tit;
        
        if (!blueColors || !redColors) {
            console.error(`Missing colors for match: ${blueTeam[0]} (${blueTeam[1]}) vs ${redTeam[0]} (${redTeam[1]})`);
            return null;
        }
        
        console.log(`Selected match: ${blueTeam[0]} vs ${redTeam[0]}`);
        
        return {
            blue: { ...blueColors, name: blueTeam[0] },
            red: { ...redColors, name: redTeam[0] }
        };
    }
}

// Initialize and validate data once when module is imported
const realTeamsLoader = RealTeamsLoader.getInstance();

export function getTeamColors(teamName: string, kitType: 'tit' | 'alt'): TeamColors | null {
    return realTeamsLoader.getTeamColors(teamName, kitType);
}

export function getAllTeamNames(): string[] {
    return realTeamsLoader.getAllTeamNames();
}

export function getTeam(teamName: string): TeamKit | null {
    return realTeamsLoader.getTeam(teamName);
}

export function getRandomMatch(): { blue: TeamColors & { name: string }, red: TeamColors & { name: string } } | null {
    return realTeamsLoader.getRandomMatch();
}