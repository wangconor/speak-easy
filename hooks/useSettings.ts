import { useAppData } from "@/context/AppDataContext";

export const useSettings = () => {
  const { settings, voices, updateSettings } = useAppData();
  return { settings, voices, updateSettings };
};
