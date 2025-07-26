
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
matchEventRouter.get("/:matchId/:playerId/:timestamp", async (ctx) => {
    await controller.getMatchEvent(ctx);
});

// POST new event
matchEventRouter.post("/", async (ctx) => {
    await controller.addMatchEvent(ctx);
});

// PUT update event
matchEventRouter.put("/:matchId/:playerId/:timestamp", async (ctx) => {
    // Implementar si tienes update en el controller
    ctx.status = 501; // Not Implemented
});

// DELETE event
matchEventRouter.delete("/:matchId/:playerId/:timestamp", async (ctx) => {
    // Implementar si tienes delete en el controller
    ctx.status = 501; // Not Implemented
});
