import { create } from "zustand";
import type { Tables } from "@/type/database-type";

interface AuthStore {
    user: Tables<'users'> | null;
    setUser: (user: Tables<'users'>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    setUser: (user: Tables<'users'>) => set({ user }),
}));