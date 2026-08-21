import { useEffect, useState, useCallback } from 'react';
import { getCustomer } from '@/api/customers';
import { getClusters } from '@/api/clusters';
import { getPlans } from '@/api/plans';
import { getRecommendationsByCustomer, getRecommendationHistory } from '@/api/recommendations';
import { useAppStore } from '@/store/useAppStore';

/**
 * Loads everything the authenticated screens need, straight from the API:
 * the customer profile + engineered usage, the 25-plan catalogue, the
 * K-Means personas, the customer's current plan and their engine-ranked
 * recommendations.
 *
 * Journey A from the plan: GET customer -> POST recommendations/by-customer/:id.
 * Ranking always comes from the backend engine; nothing is scored here.
 */
export function useCustomerBundle() {
  const customerId = useAppStore((s) => s.customerId);
  const setLastRecommendations = useAppStore((s) => s.setLastRecommendations);

  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const [customerRes, clustersRes, plansRes] = await Promise.all([
        getCustomer(customerId),
        getClusters(),
        getPlans(),
      ]);

      const customer = customerRes.data;

      // History is non-critical — a failure here must not blank the page.
      let history = [];
      try {
        history = (await getRecommendationHistory(customerId)).data;
      } catch {
        history = [];
      }

      const recRes = await getRecommendationsByCustomer(customerId);
      const recommendations = recRes.data.plans;
      setLastRecommendations(recommendations);

      const cluster =
        clustersRes.data.find((item) => item.clusterLabel === customer.clusterId) ?? recRes.data.cluster ?? null;

      const currentPlan = plansRes.data.find((plan) => plan._id === customer.currentPlanId) ?? null;

      setState({
        loading: false,
        error: null,
        customer,
        cluster,
        plans: plansRes.data,
        currentPlan,
        recommendations,
        recommendationMeta: {
          persona: recRes.data.persona,
          plansEvaluated: recRes.data.plansEvaluated,
          scoringWeights: recRes.data.scoringWeights,
          personaAssignment: recRes.data.personaAssignment,
          generatedAt: recRes.data.generatedAt,
        },
        history,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('useCustomerBundle failed', error);
      setState({ loading: false, error });
    }
  }, [customerId, setLastRecommendations]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
