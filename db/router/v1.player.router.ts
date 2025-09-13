import Router from "koa-router";
import { Context } from "koa";
import { PlayerController } from '../controller/player.controller';
import { IRepository } from '../repository/repository.interface';
import { PlayerRepository } from '../repository/player.repository';
import { Player } from '../entity/player.entity';

// Simple in-memory cache for top20 players
const cache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 30000; // 30 seconds

export const playerRouter = new Router();
const playersRepository: IRepository<Player> = new PlayerRepository();
const controller: PlayerController = new PlayerController(playersRepository);

// /v1/player GET
// get all players list and data
playerRouter.get('/', async (ctx: Context) => {
    await controller.getAllPlayers(ctx);
});

// /v1/player/top20 GET
// get top 20 players by rating (with cache)
playerRouter.get('/top20', async (ctx: Context) => {
    const cacheKey = `top20_${ctx.params.ruid || 'default'}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        ctx.status = 200;
        ctx.body = cached.data;
        return;
    }
    
    await controller.getTop20Players(ctx);
    
    // Cache successful responses
    if (ctx.status === 200) {
        cache.set(cacheKey, {
            data: ctx.body,
            timestamp: Date.now()
        });
    }
});

// /v1/player POST
// register new player
playerRouter.post('/', async (ctx: Context) => {
    await controller.addPlayer(ctx)
});

// /v1/player/:auth GET
// get the player data
playerRouter.get('/:auth', async (ctx: Context) => {
    await controller.getPlayer(ctx)
});

// /v1/player/:auth PUT
// update whole data of the player
playerRouter.put('/:auth', async (ctx: Context) => {
    await controller.updatePlayer(ctx)
});

// /v1/player/:auth DELETE
// delete the player
playerRouter.delete('/:auth', async (ctx: Context) => {
    await controller.deletePlayer(ctx)
});
