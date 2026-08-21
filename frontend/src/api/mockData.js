export const DEMO_FLAG = true;

export const demoClusters = [
  {
    _id: 'cl_heavy_streamer',
    clusterLabel: 0,
    personaName: 'Heavy-Data Streamer',
    description:
      'Streams video and music constantly, burns through data fast, rarely calls, barely texts.',
    customerCount: 4210,
    centroid: [0.86, 0.18, 0.12, 0.22, 0.15],
    traits: { data: 'Very High', calling: 'Low', sms: 'Low', roaming: 'Low' },
    color: '#22d3ee',
  },
  {
    _id: 'cl_talk_first',
    clusterLabel: 1,
    personaName: 'Talk-First Connector',
    description: 'Lives on voice calls for work and family, modest data use, low roaming.',
    customerCount: 3120,
    centroid: [0.22, 0.88, 0.3, 0.12, 0.1],
    traits: { data: 'Low', calling: 'Very High', sms: 'Medium', roaming: 'Low' },
    color: '#34d399',
  },
  {
    _id: 'cl_global_roamer',
    clusterLabel: 2,
    personaName: 'Global Roamer',
    description: 'Frequently travels abroad, needs reliable roaming and international minutes.',
    customerCount: 980,
    centroid: [0.5, 0.45, 0.2, 0.92, 0.8],
    traits: { data: 'Medium', calling: 'Medium', sms: 'Low', roaming: 'Very High' },
    color: '#fbbf24',
  },
  {
    _id: 'cl_balanced',
    clusterLabel: 3,
    personaName: 'Balanced Everyday User',
    description: 'Steady, moderate use across data, calls and texts — nothing extreme.',
    customerCount: 5460,
    centroid: [0.45, 0.42, 0.4, 0.18, 0.14],
    traits: { data: 'Medium', calling: 'Medium', sms: 'Medium', roaming: 'Low' },
    color: '#60a5fa',
  },
  {
    _id: 'cl_budget_light',
    clusterLabel: 4,
    personaName: 'Budget-Conscious Light User',
    description: 'Minimal usage across the board, highly price sensitive.',
    customerCount: 2870,
    centroid: [0.12, 0.15, 0.18, 0.05, 0.04],
    traits: { data: 'Low', calling: 'Low', sms: 'Low', roaming: 'Very Low' },
    color: '#a78bfa',
  },
];

export const demoOperators = [
  { id: 'jio', name: 'Jio', color: '#0077FF' },
  { id: 'airtel', name: 'Airtel', color: '#E40000' },
  { id: 'vi', name: 'Vi (Idea)', color: '#D81B60' },
  { id: 'bsnl', name: 'BSNL', color: '#00BFA5' },
];

export const demoPlans = [
  {
    _id: 'bsnl_249',
    planName: 'BSNL Value 4G',
    operator: 'bsnl',
    clusterIds: ['cl_budget_light'],
    price: 249,
    dataGB: 60,
    callMinutes: 3000,
    sms: 100,
    roamingIncluded: false,
    validityDays: 30,
    benefits: ['2 GB/day high speed data', 'Unlimited calls any network', 'Free PRBT & BSNL Tunes'],
    sourceOperatorRef: 'BSNL Value 4G',
  },
  {
    _id: 'vi_379',
    planName: 'Vi Hero Unlimited',
    operator: 'vi',
    clusterIds: ['cl_heavy_streamer', 'cl_balanced'],
    price: 379,
    dataGB: 100,
    callMinutes: 3000,
    sms: 100,
    roamingIncluded: false,
    validityDays: 28,
    benefits: ['Unlimited truly 5G data', 'Unlimited calls, 100 SMS/day', 'Hero exclusives & priority service'],
    sourceOperatorRef: 'Vi Hero Unlimited',
  },
  {
    _id: 'jio_299',
    planName: 'Jio True 5G Max',
    operator: 'jio',
    clusterIds: ['cl_heavy_streamer'],
    price: 299,
    dataGB: 42,
    callMinutes: 3000,
    sms: 100,
    roamingIncluded: false,
    validityDays: 28,
    benefits: ['Unlimited 5G Data (uncapped)', '1.5GB/day 4G + Unlimited Calls', 'JioCinema, JioTV & JioCloud access'],
    sourceOperatorRef: 'Jio True 5G Max',
  },
  {
    _id: 'airtel_349',
    planName: 'Airtel 5G Plus',
    operator: 'airtel',
    clusterIds: ['cl_talk_first', 'cl_balanced'],
    price: 349,
    dataGB: 56,
    callMinutes: 3000,
    sms: 100,
    roamingIncluded: false,
    validityDays: 28,
    benefits: ['Unlimited 5G Data + 2GB/day 4G', 'HD Voice calling on 820 MIN usage', 'Apollo 24|7 Circle & Wynk Music'],
    sourceOperatorRef: 'Airtel 5G Plus',
  },
];

export const demoCustomer = {
  _id: 'cust_demo_01',
  name: 'Aarav Mehta',
  phone: '+91 98xxxxxx21',
  tenureMonths: 18,
  contractType: 'postpaid',
  usage: {
    avgCallMin: 420,
    dataGB: 34,
    smsCount: 65,
    dayEveningNightSplit: { day: 0.5, evening: 0.35, night: 0.15 },
    roamingUsage: 2,
    internationalUsage: 0,
  },
  clusterId: 'cl_balanced',
  currentPlanId: 'bsnl_249',
  monthlySpend: 449,
  createdAt: '2024-11-02T10:00:00.000Z',
};

export const demoRecommendationHistory = [
  {
    _id: 'rec_1',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    source: 'chat_profile',
    recommendedPlans: [
      { planId: 'bsnl_249', score: 0.71 },
      { planId: 'vi_379', score: 0.84 },
      { planId: 'jio_299', score: 0.96 },
      { planId: 'airtel_349', score: 0.89 },
    ],
  },
];

export const demoAdminStats = {
  totalCustomers: 16640,
  totalPlans: demoPlans.length,
  totalClusters: demoClusters.length,
  recommendationsGenerated30d: 8420,
  avgMatchScore: 82,
  lastClusteringRun: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  lastBatchJobStatus: 'success',
};

export const demoKnowledgeSnippets = [
  { operatorName: 'BSNL', planName: 'BSNL Value 4G', note: 'Reference 4G budget plan' },
  { operatorName: 'Vi (Idea)', planName: 'Vi Hero Unlimited', note: 'Reference 5G unlimited plan' },
];
