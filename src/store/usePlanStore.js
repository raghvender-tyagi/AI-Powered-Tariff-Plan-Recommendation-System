import { create } from 'zustand';
import { INITIAL_USAGE, PLANS_DATA } from '../data/plansData';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('smartfit-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

export const usePlanStore = create((set, get) => ({
  // Telecom Twin Usage State
  usage: { ...INITIAL_USAGE },

  // Day & Night (Light / Dark) Theme State
  isDarkMode: getInitialTheme(),
  toggleDarkMode: () => {
    set((state) => {
      const nextMode = !state.isDarkMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smartfit-theme', nextMode ? 'dark' : 'light');
        if (nextMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDarkMode: nextMode };
    });
  },
  
  // Selected Telecom Filter Tab State ('bsnl' | 'vi' | 'jio' | 'airtel')
  selectedTelecom: 'bsnl',
  setSelectedTelecom: (telecomSlug) => set({ selectedTelecom: telecomSlug }),

  // Modals
  isOperatorDashboardOpen: false,
  isCompareModalOpen: false,
  isSimulatorOpen: false,
  selectedPlan: PLANS_DATA[0],
  
  // Actions
  setUsageField: (field, value) => {
    set((state) => {
      const updatedUsage = { ...state.usage, [field]: Number(value) };
      
      let score = 96;
      if (field === 'dataGB') {
        const diff = Math.abs(updatedUsage.dataGB - 48);
        score = Math.max(70, Math.min(99, 96 - Math.round(diff * 0.4)));
      } else if (field === 'monthlySpend') {
        const diff = Math.abs(updatedUsage.monthlySpend - 299);
        score = Math.max(65, Math.min(99, 98 - Math.round(diff * 0.1)));
      } else if (field === 'data5GGB') {
        score = Math.min(99, 85 + Math.round((updatedUsage.data5GGB / 40) * 14));
      }
      
      return {
        usage: {
          ...updatedUsage,
          matchScore: score,
        }
      };
    });
  },

  resetUsage: () => set({ usage: { ...INITIAL_USAGE } }),

  setOperatorDashboardOpen: (open) => set({ isOperatorDashboardOpen: open }),
  setCompareModalOpen: (open, plan = null) => set({ 
    isCompareModalOpen: open, 
    selectedPlan: plan || get().selectedPlan 
  }),
  setSimulatorOpen: (open) => set({ isSimulatorOpen: open }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
}));
