import { Router } from 'express';
import { biometricController } from './zkteco.controller.js';

const router = Router();

// ADMS Device Push endpoint (unauthenticated handshake for hardware)
router.all('/cdata', biometricController.handleCdata);

export const biometricRoutes = router;
