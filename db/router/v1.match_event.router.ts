
import Router from "koa-router";
import { MatchEventController } from "../controller/matchevent.controller";
import { MatchEventRepository } from "../repository/match_event.repository";

export const matchEventRouter = new Router();
const controller = new MatchEventController(new MatchEventRepository());

// GET all events for a match
matchEventRouter.get("/", async (ctx) => {
    await controller.getAllMatchEvents(ctx);
});

// GET single event
matchEventRouter.get("/:matchId/:playerAuth/:timestamp", async (ctx) => {
    await controller.getMatchEvent(ctx);
});

// POST new event
matchEventRouter.post("/", async (ctx) => {
    await controller.addMatchEvent(ctx);
});

// PUT update event
matchEventRouter.put("/:matchId/:playerAuth/:timestamp", async (ctx) => {
    // Implementar si tienes update en el controller
    ctx.status = 501; // Not Implemented
});

// DELETE event
matchEventRouter.delete("/:matchId/:playerAuth/:timestamp", async (ctx) => {
    // Implementar si tienes delete en el controller
    ctx.status = 501; // Not Implemented
});

// GET top scorers routes
matchEventRouter.get("/top", async (ctx) => {
    await controller.getTopByRange(ctx);
});
