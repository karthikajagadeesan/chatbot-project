import { create } from "zustand";
import type { Tables } from "@/type/database-type";

interface AuthStore {
    superadmin: Tables<'super_admins'> | null;
    setSuperadmin: (superadmin: Tables<'super_admins'>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    superadmin: null,
    setSuperadmin: (superadmin: Tables<'super_admins'>) => set({ superadmin }),
}));