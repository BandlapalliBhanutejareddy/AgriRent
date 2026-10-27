/**
 * MarketPriceService.ts
 * Integration with official Indian Agricultural Mandi Data (Agmarknet via data.gov.in)
 */

export interface MandiPriceRecord {
  commodity: string;
  state: string;
  district: string;
  market: string;
  variety?: string;
  grade?: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceUnit: string; // e.g. "₹/Quintal"
  arrivalDate: string;
}

export interface MarketPriceResult {
  status: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
  dataSource: string;
  lastUpdated: string;
  records: MandiPriceRecord[];
  disclaimer: string;
  missingConfigRequirement?: string;
}

// In-memory TTL cache
interface CacheEntry {
  timestamp: number;
  data: MandiPriceRecord[];
}

export class MarketPriceService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

  /**
   * Fetch market prices for a given commodity/crop
   */
  async getMarketPrices(commodity?: string, state?: string): Promise<MarketPriceResult> {
    const apiKey = process.env.DATA_GOV_IN_API_KEY || process.env.AGMARKNET_API_KEY;
    const cacheKey = `${commodity || 'ALL'}_${state || 'ALL'}`.toUpperCase();

    // Check cache
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < this.CACHE_TTL_MS)) {
      return {
        status: 'CACHED',
        dataSource: 'Agmarknet (Ministry of Agriculture, GoI)',
        lastUpdated: new Date(cached.timestamp).toISOString(),
        records: cached.data,
        disclaimer: 'Displaying cached mandi prices from official Agmarknet feed.'
      };
    }

    // If no API key is configured on server
    if (!apiKey) {
      return {
        status: 'UNAVAILABLE',
        dataSource: 'Agmarknet (Government of India / data.gov.in)',
        lastUpdated: new Date().toISOString(),
        records: [],
        disclaimer: 'Live mandi prices are currently unavailable because the official data.gov.in API key is not configured on the server. AgroRent never fabricates false prices.',
        missingConfigRequirement: 'DATA_GOV_IN_API_KEY required in server environment to stream real-time Agmarknet mandi auctions.'
      };
    }

    // Real API call to data.gov.in Agmarknet Resource
    try {
      const url = new URL('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070');
      url.searchParams.append('api-key', apiKey);
      url.searchParams.append('format', 'json');
      url.searchParams.append('limit', '25');

      if (commodity) {
        url.searchParams.append('filters[commodity]', commodity);
      }
      if (state) {
        url.searchParams.append('filters[state]', state);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Data.gov.in HTTP error ${response.status}: ${response.statusText}`);
      }

      const json: any = await response.json();
      const rawRecords: any[] = json.records || [];

      const normalizedRecords: MandiPriceRecord[] = rawRecords.map(r => ({
        commodity: r.commodity || commodity || 'Unknown',
        state: r.state || state || '',
        district: r.district || '',
        market: r.market || '',
        variety: r.variety,
        grade: r.grade,
        minPrice: parseFloat(r.min_price) || 0,
        maxPrice: parseFloat(r.max_price) || 0,
        modalPrice: parseFloat(r.modal_price) || 0,
        priceUnit: '₹/Quintal',
        arrivalDate: r.arrival_date || new Date().toISOString().split('T')[0]
      }));

      // Update cache
      this.cache.set(cacheKey, {
        timestamp: now,
        data: normalizedRecords
      });

      return {
        status: 'LIVE',
        dataSource: 'Agmarknet (Ministry of Agriculture, GoI)',
        lastUpdated: new Date().toISOString(),
        records: normalizedRecords,
        disclaimer: 'Live verified mandi transaction data from official Agmarknet auctions.'
      };
    } catch (err: any) {
      console.warn('[MarketPriceService] Live Agmarknet fetch failed:', err.message);

      // Return cached if available even if slightly older
      if (cached) {
        return {
          status: 'CACHED',
          dataSource: 'Agmarknet (Ministry of Agriculture, GoI)',
          lastUpdated: new Date(cached.timestamp).toISOString(),
          records: cached.data,
          disclaimer: 'Live Agmarknet feed temporarily unreachable; showing previously cached mandi auctions.'
        };
      }

      return {
        status: 'UNAVAILABLE',
        dataSource: 'Agmarknet (Government of India)',
        lastUpdated: new Date().toISOString(),
        records: [],
        disclaimer: 'Live Agmarknet mandi auction feed is currently unreachable. Prices are not fabricated.',
        missingConfigRequirement: `Provider unreachable: ${err.message}`
      };
    }
  }
}

export const marketPriceService = new MarketPriceService();
