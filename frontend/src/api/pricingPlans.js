import api from './axios';

let cachedPlans = null;
let inflight = null;

export async function fetchPricingPlans({ force = false } = {}) {
  if (!force && Array.isArray(cachedPlans)) return cachedPlans;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await api.get('/api/plans/pricing');
      cachedPlans = res.data?.plans || [];
      return cachedPlans;
    } catch (error) {
      if (error?.response?.status === 404) {
        const res = await api.get('/plans/pricing');
        cachedPlans = res.data?.plans || [];
        return cachedPlans;
      }
      throw error;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
