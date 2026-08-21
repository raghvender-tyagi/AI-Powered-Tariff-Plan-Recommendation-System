import { http, callWithFallback, sleep } from './client';
import { demoPlans, demoCustomer, demoRecommendationHistory } from './mockData';
import { rankPlans } from '@/lib/scoring';

const buildExplanation = (plan, profile) =>
  `${plan.planName} is a strong fit because it lines up with your ${profile?.dataNeedGB ? `${profile.dataNeedGB}GB` : 'typical'} data use and stays close to your ${profile?.budget ? `₹${profile.budget}` : 'usual'} monthly budget, while ${plan.roamingIncluded ? 'covering the roaming access you need' : 'keeping cost down since you rarely roam'}.`;

const demoRecommend = (profile) => {
  const ranked = rankPlans(demoPlans, profile, 3);
  return ranked.map((r, i) => ({
    planId: r.plan._id,
    plan: r.plan,
    score: r.total / 100,
    matchPercent: r.total,
    breakdown: r.breakdown,
    rank: i + 1,
    explanation: buildExplanation(r.plan, profile),
  }));
};

// POST /api/recommendations/by-customer/:id
export const getRecommendationsByCustomer = (id, profile) =>
  callWithFallback(
    () => http.post(`/recommendations/by-customer/${id}`),
    async () => {
      await sleep(300);
      return { plans: demoRecommend(profile || defaultProfileFromCustomer()) };
    },
  );

// POST /api/recommendations/by-profile
export const getRecommendationsByProfile = (profile) =>
  callWithFallback(
    () => http.post('/recommendations/by-profile', { profile }),
    async () => {
      await sleep(300);
      return { plans: demoRecommend(profile) };
    },
  );

export const getRecommendationHistory = (customerId) =>
  callWithFallback(
    () => http.get(`/customers/${customerId}/recommendations`),
    () => demoRecommendationHistory,
  );

function defaultProfileFromCustomer() {
  return {
    dataNeedGB: demoCustomer.usage.dataGB,
    callNeedMin: demoCustomer.usage.avgCallMin,
    budget: 650,
    roamingRequired: demoCustomer.usage.roamingUsage > 0,
    clusterId: demoCustomer.clusterId,
  };
}
