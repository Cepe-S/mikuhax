import Router from "koa-router";
import cors from "@koa/cors";
import { playerRouter } from "./v1.player.router";
import { banlistRouter } from "./v1.banlist.router";
import { superadminRouter } from "./v1.superadmin.router";
import { ruidlistRouter } from "./v1.ruidlist.router";
import { matchEventRouter } from "./v1.match_event.router";
import { matchSummaryRouter } from "./v1.match_summary.router";
import { connectionsRouter } from "./v1.connections.router";
import { mutelistRouter } from "./v1.mutelist.router";
import { MatchEventController } from "../controller/matchevent.controller";
import { MatchEventRepository } from "../repository/match_event.repository";

export const apiRouterV1 = new Router();

apiRouterV1
    .use(cors({
            origin: process.env.CLIENT_HOST, // Access-Control-Allow-Origin
            credentials: true, // Access-Control-Allow-Credentials
        }))
    .use('/ruidlist', ruidlistRouter.routes())
    .use('/room/:ruid/player', playerRouter.routes())
    .use('/room/:ruid/banlist', banlistRouter.routes())
    .use('/room/:ruid/mutelist', mutelistRouter.routes())
    .use('/room/:ruid/superadmin', superadminRouter.routes())
    .use('/room/:ruid/match_event', matchEventRouter.routes())
    .use('/room/:ruid/match_summary', matchSummaryRouter.routes())
    .use('/connections', connectionsRouter.routes());

// Explicit route for unified Top endpoint to avoid nested param issues
const _matchEventController = new MatchEventController(new MatchEventRepository());
apiRouterV1.get('/room/:ruid/match_event/top', async (ctx) => {
    await _matchEventController.getTopByRange(ctx);
});
