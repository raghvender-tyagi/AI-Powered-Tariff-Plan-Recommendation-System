import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultProfile = {
  dataNeed: undefined, // 'low' | 'medium' | 'high'
  callingNeed: undefined,
  smsNeed: undefined,
  budget: undefined,
  roamingRequired: undefined,
  familyOrIndividual: undefined,
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Identity
      customerName: 'Aarav',
      customerId: 'cust_demo_01',
      isAdmin: false,

      // Day & Night Theme
      isDarkMode: true,
      toggleDarkMode: () =>
        set((state) => {
          const next = !state.isDarkMode;
          if (typeof window !== 'undefined') {
            if (next) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
          }
          return { isDarkMode: next };
        }),

      // Onboarding profile (mirrors extract_profile tool schema, section 6.6)
      onboardingComplete: false,
      profile: defaultProfile,
      setProfileField: (field, value) =>
        set((state) => ({ profile: { ...state.profile, [field]: value } })),
      resetProfile: () => set({ profile: defaultProfile, onboardingComplete: false }),
      completeOnboarding: () => set({ onboardingComplete: true }),

      // Latest recommendation payload, shared across Dashboard / Recommendations / History
      lastRecommendations: null,
      setLastRecommendations: (plans) => set({ lastRecommendations: plans }),

      // Compare tray
      compareIds: [],
      toggleCompare: (planId) =>
        set((state) => ({
          compareIds: state.compareIds.includes(planId)
            ? state.compareIds.filter((id) => id !== planId)
            : state.compareIds.length >= 4
              ? state.compareIds
              : [...state.compareIds, planId],
        })),
      clearCompare: () => set({ compareIds: [] }),

      // Simple client-side auth flag for the admin area (demo)
      adminToken: null,
      setAdminToken: (token) => set({ adminToken: token, isAdmin: !!token }),
      logoutAdmin: () => set({ adminToken: null, isAdmin: false }),
    }),
    {
      name: 'tariff-twin-store',
      partialize: (state) => ({
        customerName: state.customerName,
        customerId: state.customerId,
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        lastRecommendations: state.lastRecommendations,
        isDarkMode: state.isDarkMode,
      }),
    },
  ),
);
