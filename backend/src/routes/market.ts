import { Router, Request, Response } from 'express';
import { marketPriceService } from '../services/market/MarketPriceService';

const router = Router();

const COMMON_INDIAN_COMMODITIES = [
  'Paddy(Dhan)(Common)',
  'Paddy(Dhan)(Basmati)',
  'Wheat',
  'Cotton',
  'Maize',
  'Bengal Gram(Gram)(Whole)',
  'Mustard',
  'Soyabean',
  'Groundnut',
  'Tomato',
  'Potato',
  'Onion',
  'Green Chilli',
  'Red Chilli',
  'Turmeric',
  'Sugarcane',
  'Bajra(Pearl Millet/Cumbu)',
  'Jowar(Sorghum)',
  'Arhar (Tur/Red Gram)(Whole)',
  'Moong(Green Gram)(Whole)',
  'Urad (Black Gram)(Whole)',
  'Banana',
  'Mango',
  'Apple'
];

const MAJOR_INDIAN_STATES = [
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Tamil Nadu',
  'Maharashtra',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Rajasthan',
  'Uttar Pradesh',
  'Gujarat',
  'Bihar',
  'West Bengal',
  'Odisha',
  'Kerala'
];

/**
 * GET /api/market/prices
 * Query live or cached Agmarknet mandi auction prices with multi-dimensional filtering
 */
router.get('/prices', async (req: Request, res: Response): Promise<void> => {
  try {
    const commodity = req.query.commodity ? String(req.query.commodity) : undefined;
    const state = req.query.state ? String(req.query.state) : undefined;
    const district = req.query.district ? String(req.query.district) : undefined;
    const market = req.query.market ? String(req.query.market) : undefined;
    const variety = req.query.variety ? String(req.query.variety) : undefined;
    const date = req.query.date ? String(req.query.date) : undefined;
    const minPriceGte = req.query.minPrice ? parseFloat(String(req.query.minPrice)) : undefined;
    const maxPriceLte = req.query.maxPrice ? parseFloat(String(req.query.maxPrice)) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

    const result = await marketPriceService.getMarketPrices({
      commodity,
      state,
      district,
      market,
      variety,
      date,
      minPriceGte,
      maxPriceLte,
      limit,
      offset
    });

    res.json(result);
  } catch (error: any) {
    console.error('Failed to retrieve market prices:', error);
    res.status(500).json({
      status: 'UNAVAILABLE',
      error: 'Failed to retrieve market prices',
      details: error.message
    });
  }
});

/**
 * GET /api/market/status
 * Health & configuration status of Agmarknet / data.gov.in integration
 */
router.get('/status', (req: Request, res: Response): void => {
  const rawKey = (process.env.DATA_GOV_IN_API_KEY || process.env.AGMARKNET_API_KEY || '').trim();
  const isConfigured = Boolean(
    rawKey &&
    rawKey.toLowerCase() !== 'your-datagov-in-api-key-here' &&
    rawKey.toLowerCase() !== 'your_api_key_here' &&
    !rawKey.toLowerCase().includes('placeholder') &&
    rawKey.length >= 10
  );

  res.json({
    integration: 'Agmarknet Agricultural Mandi Data via data.gov.in',
    resourceId: '9ef84268-d588-465a-a308-a864a43d0070',
    datasetTitle: 'Current Daily Price and Arrival of Agricultural Commodities',
    publisher: 'Directorate of Economics and Statistics, Ministry of Agriculture and Farmers Welfare, GoI',
    configured: isConfigured,
    cachePolicy: 'In-Memory TTL 30 minutes with fallback serving on transient provider failure',
    setupInstructions: isConfigured
      ? 'Agmarknet API integration is actively configured.'
      : 'Set DATA_GOV_IN_API_KEY in backend/.env with a valid API key obtained from https://data.gov.in.'
  });
});

/**
 * GET /api/market/commodities
 * List of frequently traded agricultural commodities
 */
router.get('/commodities', (req: Request, res: Response): void => {
  res.json({ commodities: COMMON_INDIAN_COMMODITIES });
});

/**
 * GET /api/market/states
 * List of major agricultural states
 */
router.get('/states', (req: Request, res: Response): void => {
  res.json({ states: MAJOR_INDIAN_STATES });
});

export default router;

