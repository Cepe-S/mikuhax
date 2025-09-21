// Database: Simple controllers for basic operations
import { Request, Response } from 'koa';
import { getRepository } from 'typeorm';
import { Player } from '../entity/player.entity';

export class SimpleController {
    
    static async getPlayer(ctx: any) {
        try {
            const { auth } = ctx.params;
            const playerRepo = getRepository(Player);
            const player = await playerRepo.findOne({ where: { auth } });
            
            if (player) {
                ctx.body = {
                    auth: player.auth,
                    name: player.name,
                    goals: player.goals,
                    assists: player.assists,
                    games: player.totals,
                    wins: player.wins
                };
            } else {
                ctx.status = 404;
                ctx.body = { error: 'Player not found' };
            }
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: 'Database error' };
        }
    }
    
    static async savePlayer(ctx: any) {
        try {
            const playerData = ctx.request.body;
            const playerRepo = getRepository(Player);
            
            let player = await playerRepo.findOne({ where: { auth: playerData.auth } });
            
            if (player) {
                // Update existing
                player.name = playerData.name;
                player.goals = playerData.goals;
                player.assists = playerData.assists;
                player.totals = playerData.games;
                player.wins = playerData.wins;
            } else {
                // Create new
                player = playerRepo.create({
                    auth: playerData.auth,
                    conn: playerData.auth, // Simple fallback
                    name: playerData.name,
                    goals: playerData.goals,
                    assists: playerData.assists,
                    totals: playerData.games,
                    wins: playerData.wins,
                    rating: 1000, // Default
                    disconns: 0,
                    ogs: 0,
                    losePoints: 0,
                    balltouch: 0,
                    passed: 0,
                    mute: false,
                    muteExpire: -1,
                    rejoinCount: 0,
                    joinDate: Date.now(),
                    leftDate: Date.now(),
                    malActCount: 0
                });
            }
            
            await playerRepo.save(player);
            ctx.body = { success: true };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: 'Save failed' };
        }
    }
    
    static async getTopGoals(ctx: any) {
        try {
            const limit = parseInt(ctx.query.limit) || 10;
            const playerRepo = getRepository(Player);
            
            const players = await playerRepo.find({
                order: { goals: 'DESC' },
                take: limit
            });
            
            ctx.body = players.map(p => ({
                auth: p.auth,
                name: p.name,
                goals: p.goals,
                assists: p.assists,
                games: p.totals,
                wins: p.wins
            }));
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: 'Query failed' };
        }
    }
    
    static async getTopAssists(ctx: any) {
        try {
            const limit = parseInt(ctx.query.limit) || 10;
            const playerRepo = getRepository(Player);
            
            const players = await playerRepo.find({
                order: { assists: 'DESC' },
                take: limit
            });
            
            ctx.body = players.map(p => ({
                auth: p.auth,
                name: p.name,
                goals: p.goals,
                assists: p.assists,
                games: p.totals,
                wins: p.wins
            }));
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: 'Query failed' };
        }
    }
}