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

// A real seeded customer id from the dataset (customer_features.csv).
// Onboarding replaces this with the id the backend creates for the visitor.
export const DEFAULT_CUSTOMER_ID = 'CUST00001';

export const useAppStore = create(
  persist(
    (set) => ({
      // Identity
      customerName: 'there',
      customerId: DEFAULT_CUSTOMER_ID,
      isAdmin: false,

      setCustomer: (customerId, customerName) =>
        set((state) => ({
          customerId: customerId ?? state.customerId,
          customerName: customerName ?? state.customerName,
          lastRecommendations: null,
        })),

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

      // Onboarding profile (mirrors the backend's extract_profile slots)
      onboardingComplete: false,
      profile: defaultProfile,
      setProfileField: (field, value) =>
        set((state) => ({ profile: { ...state.profile, [field]: value } })),
      resetProfile: () => set({ profile: defaultProfile, onboardingComplete: false }),
      completeOnboarding: () => set({ onboardingComplete: true }),

      // Latest engine response, shared across Dashboard / Recommendations / Compare
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

      // Admin session (JWT issued by POST /api/auth/login)
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
        isDarkMode: state.isDarkMode,
      }),
    },
  ),
);
