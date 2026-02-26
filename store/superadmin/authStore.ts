import { create } from "zustand";
import type { Tables } from "@/type/database-type";

interface AuthStore {
    superadmin: any | null;
    setSuperadmin: (superadmin: any) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    superadmin: null,
    setSuperadmin: (superadmin: any) => set({ superadmin }),
}));