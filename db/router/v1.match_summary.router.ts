
import Router from "koa-router";
import { MatchSummaryController } from "../controller/matchsummary.controller";
import { MatchSummaryRepository } from "../repository/match_summary.repository";

export const matchSummaryRouter = new Router();
const controller = new MatchSummaryController(new MatchSummaryRepository());

// GET all summaries for a ruid
matchSummaryRouter.get("/", async (ctx) => {
    await controller.getAllMatchSummaries(ctx);
});

// GET single summary
matchSummaryRouter.get("/:matchId", async (ctx) => {
    await controller.getMatchSummary(ctx);
});

// POST new summary
matchSummaryRouter.post("/", async (ctx) => {
    await controller.addMatchSummary(ctx);
});

// PUT update summary
matchSummaryRouter.put("/:matchId", async (ctx) => {
    ctx.status = 501; // Not Implemented
});

// DELETE summary
matchSummaryRouter.delete("/:matchId", async (ctx) => {
    ctx.status = 501; // Not Implemented
});
