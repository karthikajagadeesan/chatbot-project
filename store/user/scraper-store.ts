import { create } from 'zustand';
import type { Tables } from '@/type/database-type';

interface ScraperStore {
    endpoints: Tables<'scraped_endpoints'>[];
    setEndpoints: (endpoints: Tables<'scraped_endpoints'>[]) => void;
    addEndpoints: (endpoints: Tables<'scraped_endpoints'>[]) => void;
    removeEndpoint: (id: string) => void;
    updateEndpoint: (id: string, updates: Partial<Tables<'scraped_endpoints'>>) => void;
}

export const useScraperStore = create<ScraperStore>((set) => ({
    endpoints: [],
    setEndpoints: (endpoints) => set({ endpoints }),
    addEndpoints: (newEndpoints) => set((state) => {
        // Prevent duplicates by URL
        const existingUrls = new Set(state.endpoints.map(e => e.url));
        const filteredNew = newEndpoints.filter(e => !existingUrls.has(e.url));
        return { endpoints: [...state.endpoints, ...filteredNew] };
    }),
    removeEndpoint: (id) => set((state) => ({
        endpoints: state.endpoints.filter((ep) => ep.id !== id)
    })),
    updateEndpoint: (id, updates) => set((state) => ({
        endpoints: state.endpoints.map((ep) =>
            ep.id === id ? { ...ep, ...updates } : ep
        )
    })),
}));
