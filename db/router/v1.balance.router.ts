import Router from "koa-router";

export const balanceRouter = new Router();

// Basic balance status endpoint
balanceRouter.get('/status', async (ctx) => {
    ctx.body = {
        status: 'active',
        message: 'Balance system operational'
    };
});