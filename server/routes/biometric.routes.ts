import { Router } from 'express';
import { biometricController } from '../controllers/biometric.controller.js';

const router = Router();

// ZKTeco ADMS Protocol Endpoints
router.get('/cdata', biometricController.handleCdata);
router.post('/cdata', biometricController.handleCdata);
router.get('/getrequest', biometricController.handleGetRequest);
router.post('/devicecmd', biometricController.handleDeviceCmd);

// Catch-all fallback for any other device subpaths
router.all('*', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('OK\r\n');
});

export const biometricRoutes = router;
