import Router from "koa-router";
import { MuteListController } from "../controller/mutelist.controller";
import { MuteListRepository } from "../repository/mutelist.repository";

export const mutelistRouter = new Router();
const controller = new MuteListController(new MuteListRepository());

// GET all muted players
mutelistRouter.get("/", async (ctx) => {
    await controller.getAllMutedPlayers(ctx);
});

// GET single muted player by auth or conn
mutelistRouter.get("/:identifier", async (ctx) => {
    await controller.getMutedPlayer(ctx);
});

// POST new mute
mutelistRouter.post("/", async (ctx) => {
    await controller.addMutePlayer(ctx);
});

// PUT update mute
mutelistRouter.put("/:identifier", async (ctx) => {
    await controller.updateMutedPlayer(ctx);
});

// DELETE mute (unmute)
mutelistRouter.delete("/:identifier", async (ctx) => {
    await controller.deleteMutedPlayer(ctx);
});
