import { useMemo } from "react";

import { useAppData } from "@/context/AppDataContext";

export const usePacks = () => {
  const appData = useAppData();

  const packs = useMemo(
    () =>
      appData.categories.map((category) => ({
        ...category,
        phraseCount: appData.phrases.filter((phrase) => phrase.categoryId === category.id).length
      })),
    [appData.categories, appData.phrases]
  );

  return {
    ...appData,
    packs
  };
};
