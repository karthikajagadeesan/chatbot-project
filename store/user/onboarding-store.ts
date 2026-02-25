import { create } from 'zustand'

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'

interface OnboardingState {
    // Step 1: Profile
    firstName: string
    lastName: string

    // Step 2: First Project
    projectName: string
    targetUrl: string

    // Step 3: Plan
    selectedPlan: SubscriptionPlan

    // Navigation State
    currentStep: number

    // Actions
    updateProfile: (data: { firstName: string; lastName: string }) => void
    updateProject: (data: { projectName: string; targetUrl: string }) => void
    setPlan: (plan: SubscriptionPlan) => void
    nextStep: () => void
    prevStep: () => void
    reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    firstName: '',
    lastName: '',
    projectName: '',
    targetUrl: '',
    selectedPlan: 'free',
    currentStep: 1,

    updateProfile: (data) => set((state) => ({ ...state, ...data })),
    updateProject: (data) => set((state) => ({ ...state, ...data })),
    setPlan: (plan) => set({ selectedPlan: plan }),

    nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
    prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
    reset: () => set({
        firstName: '',
        lastName: '',
        projectName: '',
        targetUrl: '',
        selectedPlan: 'free',
        currentStep: 1,
    }),
}))
