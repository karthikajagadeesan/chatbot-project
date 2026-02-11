import { create } from "zustand";
import type { Tables } from "@/type/database-type";
interface AppSettingsStore {
  settings: Partial<Tables<'app_settings'>>;
  isLoaded: boolean;
  setSettings: (settings: Partial<Tables<'app_settings'>>) => void;
}

const defaultSettings: Partial<Tables<'app_settings'>> = {
  app_name: "Chatbot",
  favicon_url: "",
  dark_logo_url: "",
  light_logo_url: "",
};

export const useAppSettingsStore = create<AppSettingsStore>((set) => ({
  settings: defaultSettings,
  isLoaded: false,
  setSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
      isLoaded: true,
    })),
}));

