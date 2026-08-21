import { useEffect, useState, useCallback } from 'react';
import { getCustomer } from '@/api/customers';
import { getClusters } from '@/api/clusters';
import { getPlans } from '@/api/plans';
import { getRecommendationsByCustomer, getRecommendationHistory } from '@/api/recommendations';
import { useAppStore } from '@/store/useAppStore';

/**
 * Loads everything the authenticated screens need: the customer profile +
 * usage, the plan catalogue, cluster/persona data, the customer's current
 * plan, and their latest AI recommendations. Mirrors Journey A from the
 * technical plan (GET usage -> POST recommendations/by-customer/:id).
 */
export function useCustomerBundle() {
  const customerId = useAppStore((s) => s.customerId);
  const storedRecommendations = useAppStore((s) => s.lastRecommendations);
  const setLastRecommendations = useAppStore((s) => s.setLastRecommendations);
  const profile = useAppStore((s) => s.profile);

  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [customerRes, clustersRes, plansRes, historyRes] = await Promise.all([
        getCustomer(customerId),
        getClusters(),
        getPlans(),
        getRecommendationHistory(customerId),
      ]);

      let recommendations = storedRecommendations;
      let recDemo = false;
      if (!recommendations || recommendations.length === 0) {
        const derivedProfile = {
          dataNeedGB: customerRes.data.usage?.dataGB,
          callNeedMin: customerRes.data.usage?.avgCallMin,
          budget: profile?.budget ?? 650,
          roamingRequired: (customerRes.data.usage?.roamingUsage ?? 0) > 0,
          clusterId: customerRes.data.clusterId,
        };
        const recRes = await getRecommendationsByCustomer(customerId, derivedProfile);
        recommendations = recRes.data.plans;
        recDemo = recRes.demo;
        setLastRecommendations(recommendations);
      }

      const cluster = clustersRes.data.find((c) => c._id === customerRes.data.clusterId) || null;
      const currentPlan = plansRes.data.find((p) => p._id === customerRes.data.currentPlanId) || null;

      setState({
        loading: false,
        error: null,
        customer: customerRes.data,
        cluster,
        plans: plansRes.data,
        currentPlan,
        recommendations,
        history: historyRes.data,
        demo: {
          customer: customerRes.demo,
          clusters: clustersRes.demo,
          plans: plansRes.demo,
          recommendations: recDemo,
          history: historyRes.demo,
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('useCustomerBundle failed', error);
      setState({ loading: false, error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
