import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import DomainFinder from "@/helpers/domain-finder";
import { Response } from "@/type/general-type";
import { Subdomain } from "@/type/general-type";

interface generalStore {
    subdomain: Subdomain | null;
    isSidebarOpen: boolean;
    isCollapsed: boolean;
    setSubdomain: (subdomain: Subdomain | null) => void;
    setIsSidebarOpen: (isSidebarOpen: boolean) => void;
    setIsCollapsed: (isCollapsed: boolean) => void;
    fetchSubdomain: () => Promise<Response<Subdomain | null>>;
}

export const usegeneralStore = create<generalStore>()(
    persist(
        (set) => ({
            subdomain: null,
            isSidebarOpen: false,
            isCollapsed: false,
            setSubdomain: (subdomain) => set({ subdomain }),
            setIsSidebarOpen: (isSidebarOpen: boolean) => set({ isSidebarOpen }),
            setIsCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
            fetchSubdomain: async () => {
                try {
                    const subdomain = DomainFinder(window.location.hostname);
                    if (subdomain) {
                        set({ subdomain });
                        return {
                            success: true,
                            message: "Subdomain fetched successfully",
                            data: subdomain,
                        };
                    }
                    return {
                        success: false,
                        message: "Subdomain not found",
                        data: null,
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: error instanceof Error ? error.message : "Failed to fetch subdomain",
                        data: null,
                    };
                }
            }
        }), {
        name: "general",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
            isSidebarOpen: state.isSidebarOpen,
            isCollapsed: state.isCollapsed,
        }),
    }
    )
);

export default usegeneralStore;