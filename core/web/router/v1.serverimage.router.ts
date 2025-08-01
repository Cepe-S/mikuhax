import Router from 'koa-router';
import * as serverImageController from '../controller/api/v1/serverimage';

export const serverImageRouter = new Router();

// Server Images routes
serverImageRouter.post('/', serverImageController.createServerImage);
serverImageRouter.get('/', serverImageController.listServerImages);
serverImageRouter.get('/:imageId', serverImageController.getServerImage);
serverImageRouter.delete('/:imageId', serverImageController.deleteServerImage);

// Deploy route
serverImageRouter.post('/deploy', serverImageController.deployFromImage);

// Create image from existing room
serverImageRouter.post('/rooms/:ruid/create-image', serverImageController.createServerImageFromRoom);