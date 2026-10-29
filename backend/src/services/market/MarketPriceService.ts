/**
 * MarketPriceService.ts
 * Integration with official Indian Agricultural Mandi Data (Agmarknet via data.gov.in)
 * Resource ID: 9ef84268-d588-465a-a308-a864a43d0070 (Wholesale Price of Agricultural Commodities on daily basis)
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
  priceUnit: string; // "₹/Quintal"
  arrivalDate: string; // ISO YYYY-MM-DD
}

export interface MarketComparison {
  commodity: string;
  highestMarket: { market: string; district: string; state: string; modalPrice: number };
  lowestMarket: { market: string; district: string; state: string; modalPrice: number };
  priceSpread: number; // difference between highest and lowest modal price
  averageModalPrice: number;
  reportingMarketsCount: number;
}

export interface HistoricalPricePoint {
  date: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  marketCount: number;
}

export interface MarketInsights {
  comparisons: MarketComparison[];
  historicalTrends: Record<string, HistoricalPricePoint[]>; // commodity -> date points
  totalRecords: number;
  reportingStatesCount: number;
  reportingMarketsCount: number;
}

export interface MarketPriceFilterOptions {
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
  variety?: string;
  date?: string; // YYYY-MM-DD or DD/MM/YYYY
  minPriceGte?: number;
  maxPriceLte?: number;
  limit?: number;
  offset?: number;
}

export interface MarketPriceResult {
  status: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
  dataSource: string;
  resourceId: string;
  lastUpdated: string;
  isStale?: boolean;
  records: MandiPriceRecord[];
  totalRecordsAvailable: number;
  insights?: MarketInsights;
  disclaimer: string;
  missingConfigRequirement?: string;
}

interface CacheEntry {
  timestamp: number;
  result: MarketPriceResult;
}

export class MarketPriceService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes TTL
  private readonly RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
  private readonly BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

  /**
   * Check if a configured API key is valid or a placeholder
   */
  private getValidApiKey(): string | null {
    const rawKey = (process.env.DATA_GOV_IN_API_KEY || process.env.AGMARKNET_API_KEY || '').trim();
    if (!rawKey) return null;
    const lower = rawKey.toLowerCase();
    if (
      lower === 'your-datagov-in-api-key-here' ||
      lower === 'your_datagov_in_api_key_here' ||
      lower === 'your_api_key_here' ||
      lower.includes('placeholder') ||
      rawKey.length < 10
    ) {
      return null;
    }
    return rawKey;
  }

  /**
   * Normalize arrival date to YYYY-MM-DD
   */
  private normalizeDate(rawDate?: string): string {
    if (!rawDate) return new Date().toISOString().split('T')[0];
    const trimmed = rawDate.trim();
    // Check DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    // Check YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return trimmed;
  }

  /**
   * Build cache key from filter options
   */
  private buildCacheKey(options: MarketPriceFilterOptions): string {
    const parts = [
      options.commodity || 'ALL',
      options.state || 'ALL',
      options.district || 'ALL',
      options.market || 'ALL',
      options.variety || 'ALL',
      options.date || 'ALL',
      options.minPriceGte ?? 'NONE',
      options.maxPriceLte ?? 'NONE',
      options.limit ?? 50,
      options.offset ?? 0
    ];
    return parts.join('|').toUpperCase();
  }

  /**
   * Fetch market prices with comprehensive filtering, caching, and genuine insights
   */
  async getMarketPrices(options: MarketPriceFilterOptions = {}): Promise<MarketPriceResult> {
    const apiKey = this.getValidApiKey();
    const cacheKey = this.buildCacheKey(options);
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    // 1. Check valid cache
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return {
        ...cached.result,
        status: 'CACHED',
        isStale: false,
        disclaimer: 'Displaying cached mandi prices from official Agmarknet auctions (verified within 30 minutes).'
      };
    }

    // 2. Handle missing or placeholder API key
    if (!apiKey) {
      return {
        status: 'UNAVAILABLE',
        dataSource: 'Agmarknet (Directorate of Economics and Statistics, Ministry of Agriculture & Farmers Welfare)',
        resourceId: this.RESOURCE_ID,
        lastUpdated: new Date().toISOString(),
        records: [],
        totalRecordsAvailable: 0,
        disclaimer: 'Live mandi prices are currently unavailable because the official data.gov.in API key is not configured on the server. AgroRent never fabricates false prices.',
        missingConfigRequirement: 'DATA_GOV_IN_API_KEY required in server environment to stream real-time Agmarknet mandi auctions. Register at https://data.gov.in to obtain an official API key and configure DATA_GOV_IN_API_KEY in backend/.env.'
      };
    }

    // 3. Perform live API request to data.gov.in
    try {
      const url = new URL(this.BASE_URL);
      url.searchParams.append('api-key', apiKey);
      url.searchParams.append('format', 'json');
      const limit = Math.min(Math.max(options.limit || 50, 1), 100);
      url.searchParams.append('limit', String(limit));
      if (options.offset && options.offset > 0) {
        url.searchParams.append('offset', String(options.offset));
      }

      const cleanState = (options.state || '').trim();
      if (cleanState && cleanState !== 'All States' && cleanState !== 'ALL' && cleanState.toLowerCase() !== 'state') {
        url.searchParams.append('filters[state]', cleanState);
      }
      const cleanDistrict = (options.district || '').trim();
      if (cleanDistrict && cleanDistrict !== 'All Districts' && cleanDistrict !== 'ALL' && cleanDistrict.toLowerCase() !== 'district') {
        url.searchParams.append('filters[district]', cleanDistrict);
      }
      const cleanMarket = (options.market || '').trim();
      if (cleanMarket && cleanMarket !== 'All Markets' && cleanMarket !== 'ALL' && cleanMarket.toLowerCase() !== 'market') {
        url.searchParams.append('filters[market]', cleanMarket);
      }
      const cleanCommodity = (options.commodity || '').trim();
      if (cleanCommodity && cleanCommodity !== 'All Commodities' && cleanCommodity !== 'ALL' && cleanCommodity.toLowerCase() !== 'commodity') {
        const normalizedComm = cleanCommodity.replace(/\s*\(\s*/g, '(').replace(/\s*\)\s*/g, ')');
        url.searchParams.append('filters[commodity]', normalizedComm);
      }
      const cleanVariety = (options.variety || '').trim();
      if (cleanVariety && cleanVariety !== 'ALL' && cleanVariety.toLowerCase() !== 'variety') {
        url.searchParams.append('filters[variety]', cleanVariety);
      }
      if (options.date) {
        url.searchParams.append('filters[arrival_date]', options.date.trim());
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        throw new Error('Data.gov.in authentication rejected. The provided DATA_GOV_IN_API_KEY is invalid or unauthorized.');
      } else if (response.status === 429) {
        throw new Error('Data.gov.in API rate limit exceeded. Please retry in a few moments.');
      } else if (!response.ok) {
        throw new Error(`Data.gov.in HTTP error ${response.status}: ${response.statusText}`);
      }

      const json: any = await response.json();
      const rawRecords: any[] = json.records || [];
      const totalAvailable = typeof json.total === 'number' ? json.total : rawRecords.length;

      // Normalize and sanitize records
      let normalized: MandiPriceRecord[] = rawRecords.map((r) => {
        const minP = parseFloat(r.min_price) || 0;
        const maxP = parseFloat(r.max_price) || 0;
        let modP = parseFloat(r.modal_price) || 0;
        if (modP === 0 && minP > 0 && maxP > 0) {
          modP = Math.round((minP + maxP) / 2);
        }

        return {
          commodity: String(r.commodity || options.commodity || 'Unknown').trim(),
          state: String(r.state || options.state || '').trim(),
          district: String(r.district || '').trim(),
          market: String(r.market || '').trim(),
          variety: r.variety ? String(r.variety).trim() : undefined,
          grade: r.grade ? String(r.grade).trim() : undefined,
          minPrice: Math.max(minP, 0),
          maxPrice: Math.max(maxP, 0),
          modalPrice: Math.max(modP, 0),
          priceUnit: '₹/Quintal',
          arrivalDate: this.normalizeDate(r.arrival_date)
        };
      });

      // Post-filtering for price thresholds if requested
      if (options.minPriceGte != null) {
        normalized = normalized.filter((r) => r.modalPrice >= options.minPriceGte!);
      }
      if (options.maxPriceLte != null) {
        normalized = normalized.filter((r) => r.modalPrice <= options.maxPriceLte!);
      }

      // Compute genuine insights strictly from returned data
      const insights = this.calculateGenuineInsights(normalized);

      const liveResult: MarketPriceResult = {
        status: 'LIVE',
        dataSource: 'Agmarknet (Directorate of Economics and Statistics, Ministry of Agriculture & Farmers Welfare, GoI via data.gov.in)',
        resourceId: this.RESOURCE_ID,
        lastUpdated: new Date().toISOString(),
        isStale: false,
        records: normalized,
        totalRecordsAvailable: totalAvailable,
        insights,
        disclaimer: 'Live verified mandi transaction data streamed from official Agmarknet auctions.'
      };

      // Store in memory cache
      this.cache.set(cacheKey, {
        timestamp: now,
        result: liveResult
      });

      return liveResult;
    } catch (err: any) {
      console.warn('[MarketPriceService] Agmarknet fetch warning:', err.message);

      // 4. Return stale cached data if present
      if (cached) {
        return {
          ...cached.result,
          status: 'CACHED',
          isStale: true,
          disclaimer: `Live Agmarknet feed temporarily unreachable (${err.message}). Displaying previously verified cached mandi auction data from ${new Date(cached.timestamp).toLocaleTimeString()}.`
        };
      }

      // 5. If no cache exists, return honest UNAVAILABLE status without fabricating numbers
      return {
        status: 'UNAVAILABLE',
        dataSource: 'Agmarknet (Government of India / data.gov.in)',
        resourceId: this.RESOURCE_ID,
        lastUpdated: new Date().toISOString(),
        records: [],
        totalRecordsAvailable: 0,
        disclaimer: 'Live Agmarknet mandi auction feed is currently unreachable. AgroRent strictly adheres to data integrity and does not fabricate fake prices.',
        missingConfigRequirement: `Provider unreachable: ${err.message}`
      };
    }
  }

  /**
   * Compute genuine market comparisons and historical price trends from actual returned data
   */
  private calculateGenuineInsights(records: MandiPriceRecord[]): MarketInsights {
    const states = new Set<string>();
    const markets = new Set<string>();
    const commodityGroups: Map<string, MandiPriceRecord[]> = new Map();

    for (const r of records) {
      if (r.state) states.add(r.state);
      if (r.market) markets.add(r.market);
      const group = commodityGroups.get(r.commodity) || [];
      group.push(r);
      commodityGroups.set(r.commodity, group);
    }

    const comparisons: MarketComparison[] = [];
    const historicalTrends: Record<string, HistoricalPricePoint[]> = {};

    commodityGroups.forEach((groupRecords, commodity) => {
      // 1. Market Comparisons (only when at least 2 distinct markets exist)
      const validModalRecords = groupRecords.filter((r) => r.modalPrice > 0);
      if (validModalRecords.length >= 2) {
        const sorted = [...validModalRecords].sort((a, b) => b.modalPrice - a.modalPrice);
        const highest = sorted[0];
        const lowest = sorted[sorted.length - 1];
        const sumModal = sorted.reduce((sum, r) => sum + r.modalPrice, 0);
        const avg = Math.round(sumModal / sorted.length);

        comparisons.push({
          commodity,
          highestMarket: {
            market: highest.market,
            district: highest.district,
            state: highest.state,
            modalPrice: highest.modalPrice
          },
          lowestMarket: {
            market: lowest.market,
            district: lowest.district,
            state: lowest.state,
            modalPrice: lowest.modalPrice
          },
          priceSpread: highest.modalPrice - lowest.modalPrice,
          averageModalPrice: avg,
          reportingMarketsCount: sorted.length
        });
      }

      // 2. Historical Price Trends across arrival dates
      const dateMap: Map<string, { sumModal: number; min: number; max: number; count: number }> = new Map();
      for (const r of validModalRecords) {
        const d = r.arrivalDate;
        const entry = dateMap.get(d) || { sumModal: 0, min: Infinity, max: -Infinity, count: 0 };
        entry.sumModal += r.modalPrice;
        entry.min = Math.min(entry.min, r.minPrice || r.modalPrice);
        entry.max = Math.max(entry.max, r.maxPrice || r.modalPrice);
        entry.count += 1;
        dateMap.set(d, entry);
      }

      if (dateMap.size >= 2) {
        const trendPoints: HistoricalPricePoint[] = Array.from(dateMap.entries())
          .sort(([d1], [d2]) => d1.localeCompare(d2))
          .map(([date, stat]) => ({
            date,
            modalPrice: Math.round(stat.sumModal / stat.count),
            minPrice: stat.min === Infinity ? 0 : stat.min,
            maxPrice: stat.max === -Infinity ? 0 : stat.max,
            marketCount: stat.count
          }));
        historicalTrends[commodity] = trendPoints;
      }
    });

    return {
      comparisons,
      historicalTrends,
      totalRecords: records.length,
      reportingStatesCount: states.size,
      reportingMarketsCount: markets.size
    };
  }

  /**
   * Clear in-memory cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Set manual cache entry (useful for unit testing cache behaviors)
   */
  setCacheEntry(key: string, entry: CacheEntry): void {
    this.cache.set(key, entry);
  }
}

export const marketPriceService = new MarketPriceService();
