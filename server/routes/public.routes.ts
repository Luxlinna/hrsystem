import { Router } from 'express';
import { publicController } from '../controllers/public.controller.js';

export const publicRoutes: Router = Router();

publicRoutes.get('/info', publicController.getInfo);
publicRoutes.post('/contact', publicController.submitContact);
