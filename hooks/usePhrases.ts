import { useMemo } from "react";

import { useAppData } from "@/context/AppDataContext";
import type { Phrase } from "@/types";

const sortPhrases = (phrases: Phrase[]) =>
  [...phrases].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }
    return left.sortOrder - right.sortOrder;
  });

export const usePhrases = (categoryId: string | null | undefined = undefined) => {
  const appData = useAppData();

  const phrases = useMemo(() => {
    if (categoryId === undefined) {
      return sortPhrases(appData.phrases);
    }

    if (categoryId === null) {
      return sortPhrases(appData.phrases.filter((phrase) => phrase.categoryId === null || phrase.isPinned));
    }

    return sortPhrases(appData.phrases.filter((phrase) => phrase.categoryId === categoryId));
  }, [appData.phrases, categoryId]);

  return {
    ...appData,
    phrases
  };
};
