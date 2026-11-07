import express from 'express';
import { getHotspots, getWeather } from './controller.js';

const router = express.Router();

router.get('/hotspots', getHotspots);
router.get('/weather', getWeather);

export default router;