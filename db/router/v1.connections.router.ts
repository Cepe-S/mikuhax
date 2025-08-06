import Router from "koa-router";
import * as connectionController from "../controller/connection.controller";

export const connectionsRouter = new Router();

// POST /api/v1/connections - Track new connection (for core integration)
connectionsRouter.post('/', connectionController.trackConnection);

// GET /api/v1/connections/:auth/analytics - Get connection analytics for a player
connectionsRouter.get('/:auth/analytics', connectionController.getPlayerAnalytics);

// GET /api/v1/connections/:id - Get single connection
connectionsRouter.get('/:id', connectionController.getSingleConnection);

// GET /api/v1/connections/suspicious - Get list of suspicious connections
connectionsRouter.get('/suspicious', connectionController.getSuspiciousConnections);
