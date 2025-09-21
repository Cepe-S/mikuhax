// Database: Simple routes for basic operations
import Router from 'koa-router';
import { SimpleController } from '../controller/simple.controller';

const simpleRouter = new Router();

// Player routes
simpleRouter.get('/player/:auth', SimpleController.getPlayer);
simpleRouter.post('/player', SimpleController.savePlayer);

// Top lists
simpleRouter.get('/top/goals', SimpleController.getTopGoals);
simpleRouter.get('/top/assists', SimpleController.getTopAssists);

export { simpleRouter };