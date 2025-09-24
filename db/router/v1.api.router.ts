import Router from "koa-router";
import cors from "@koa/cors";
import { playerRouter } from "./v1.player.router";
import { superadminRouter } from "./v1.superadmin.router";
import { ruidlistRouter } from "./v1.ruidlist.router";
import { matchEventRouter } from "./v1.match_event.router";
import { matchSummaryRouter } from "./v1.match_summary.router";
import { connectionsRouter } from "./v1.connections.router";
import { sanctionsRouter } from "./v1.sanctions.router";
import { balanceRouter } from "../../web/router/api/v1/balance";
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
    .use('/room/:ruid/superadmin', superadminRouter.routes())
    .use('/room/:ruid', sanctionsRouter.routes())
    .use('/room/:ruid/match_event', matchEventRouter.routes())
    .use('/room/:ruid/match_summary', matchSummaryRouter.routes())
    .use('/room/:ruid/balance', balanceRouter.routes())
    .use('/connections', connectionsRouter.routes());

// Explicit route for unified Top endpoint to avoid nested param issues
const _matchEventController = new MatchEventController(new MatchEventRepository());
apiRouterV1.get('/room/:ruid/match_event/top', async (ctx) => {
    await _matchEventController.getTopByRange(ctx);
});
