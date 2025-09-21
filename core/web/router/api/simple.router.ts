// Backend: Simple API routes
import Router from 'koa-router';
import { getServerImages, activateServerImage, getActiveConfig } from '../../controller/api/v1/simple';

const simpleApiRouter = new Router();

simpleApiRouter.get('/server-images', getServerImages);
simpleApiRouter.post('/server-images/:imageId/activate', activateServerImage);
simpleApiRouter.get('/active-config', getActiveConfig);

export { simpleApiRouter };