import { Router } from 'express';
import { referenceController } from '../controllers/reference.controller.js';
import { cacheResponse } from '../middleware/cache.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Master data accessible across authenticated sessions
router.use(authenticate);

// 1. Branches & Locations (Cached 24h)
router.get('/branches', cacheResponse({ ttlSeconds: 86400, isPrivate: false }), referenceController.getBranches);
router.get('/work-locations', cacheResponse({ ttlSeconds: 86400, isPrivate: false }), referenceController.getWorkLocations);

// 2. Departments & Divisions (Cached 12h)
router.get('/departments', cacheResponse({ ttlSeconds: 43200, isPrivate: false }), referenceController.getDepartments);
router.get('/divisions', cacheResponse({ ttlSeconds: 43200, isPrivate: false }), referenceController.getDivisions);

// 3. Holidays & Leave Types (Cached 24h)
router.get('/leave-types', cacheResponse({ ttlSeconds: 86400, isPrivate: false }), referenceController.getLeaveTypes);
router.get('/holidays', cacheResponse({ ttlSeconds: 86400, isPrivate: false }), referenceController.getHolidays);

// 4. Shifts (Cached 6h)
router.get('/shifts', cacheResponse({ ttlSeconds: 21600, isPrivate: false }), referenceController.getShifts);

export const referenceRoutes = router;
