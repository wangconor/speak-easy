import AsyncStorage from "@react-native-async-storage/async-storage";

import { seedCategories, seedPhrases } from "@/constants/seedData";
import type { Category, CategoryInput, ExportPayload, HistoryItem, Phrase, PhraseInput } from "@/types";

const STORE_KEY = "speakeasy.webDatabase.v1";

type WebStore = {
  categories: Category[];
  phrases: Phrase[];
  history: HistoryItem[];
};

const nowIso = () => new Date().toISOString();

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const clean = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const createSeedStore = (): WebStore => {
  const createdAt = nowIso();
  return {
    categories: seedCategories.map((category) => ({
      ...category,
      createdAt
    })),
    phrases: seedPhrases.map((phrase) => ({
      ...phrase,
      createdAt
    })),
    history: []
  };
};

const sortCategories = (categories: Category[]) =>
  [...categories].sort((left, right) => {
    const order = left.sortOrder - right.sortOrder;
    return order || left.name.localeCompare(right.name);
  });

const sortPhrases = (phrases: Phrase[]) =>
  [...phrases].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }
    const order = left.sortOrder - right.sortOrder;
    return order || left.createdAt.localeCompare(right.createdAt);
  });

const sortHistory = (history: HistoryItem[]) =>
  [...history].sort((left, right) => right.spokenAt.localeCompare(left.spokenAt)).slice(0, 20);

const readStore = async (): Promise<WebStore> => {
  const stored = await AsyncStorage.getItem(STORE_KEY);
  if (!stored) {
    const seeded = createSeedStore();
    await writeStore(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<WebStore>;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      phrases: Array.isArray(parsed.phrases) ? parsed.phrases : [],
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    const seeded = createSeedStore();
    await writeStore(seeded);
    return seeded;
  }
};

const writeStore = async (store: WebStore) => {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
};

const updateStore = async <T>(updater: (store: WebStore) => T | Promise<T>) => {
  const store = await readStore();
  const result = await updater(store);
  await writeStore(store);
  return result;
};

const nextPhraseSortOrder = (phrases: Phrase[], categoryId: string | null) => {
  const matching = phrases.filter((phrase) => phrase.categoryId === categoryId);
  return matching.reduce((max, phrase) => Math.max(max, phrase.sortOrder), -1) + 1;
};

const nextCategorySortOrder = (categories: Category[]) =>
  categories.reduce((max, category) => Math.max(max, category.sortOrder), -1) + 1;

export const initializeDatabase = async () => {
  await readStore();
};

export const fetchCategories = async () => {
  const store = await readStore();
  return sortCategories(store.categories);
};

export const fetchPhrases = async () => {
  const store = await readStore();
  return sortPhrases(store.phrases);
};

export const fetchHistory = async () => {
  const store = await readStore();
  return sortHistory(store.history);
};

export const createPhrase = async (input: PhraseInput) =>
  updateStore((store) => {
    const categoryId = input.categoryId ?? null;
    const id = makeId("phrase");
    store.phrases.push({
      id,
      text: input.text.trim(),
      label: clean(input.label),
      emoji: clean(input.emoji),
      color: clean(input.color),
      categoryId,
      voiceId: clean(input.voiceId),
      language: clean(input.language),
      isPinned: Boolean(input.isPinned),
      isQuickAccess: Boolean(input.isQuickAccess),
      sortOrder: input.sortOrder ?? nextPhraseSortOrder(store.phrases, categoryId),
      isDefault: Boolean(input.isDefault),
      createdAt: nowIso()
    });
    return id;
  });

export const updatePhrase = async (id: string, input: PhraseInput) =>
  updateStore((store) => {
    store.phrases = store.phrases.map((phrase) =>
      phrase.id === id
        ? {
            ...phrase,
            text: input.text.trim(),
            label: clean(input.label),
            emoji: clean(input.emoji),
            color: clean(input.color),
            categoryId: input.categoryId ?? null,
            voiceId: clean(input.voiceId),
            language: clean(input.language),
            isPinned: Boolean(input.isPinned),
            isQuickAccess: Boolean(input.isQuickAccess),
            sortOrder: input.sortOrder ?? phrase.sortOrder
          }
        : phrase
    );
  });

export const deletePhrase = async (id: string) =>
  updateStore((store) => {
    store.phrases = store.phrases.filter((phrase) => phrase.id !== id);
  });

export const reorderPhrases = async (ids: string[]) =>
  updateStore((store) => {
    const order = new Map(ids.map((id, index) => [id, index]));
    store.phrases = store.phrases.map((phrase) =>
      order.has(phrase.id) ? { ...phrase, sortOrder: order.get(phrase.id) ?? phrase.sortOrder } : phrase
    );
  });

export const createCategory = async (input: CategoryInput) =>
  updateStore((store) => {
    const id = makeId("category");
    store.categories.push({
      id,
      name: input.name.trim(),
      emoji: clean(input.emoji),
      color: clean(input.color),
      sortOrder: input.sortOrder ?? nextCategorySortOrder(store.categories),
      isDefault: Boolean(input.isDefault),
      createdAt: nowIso()
    });
    return id;
  });

export const updateCategory = async (id: string, input: CategoryInput) =>
  updateStore((store) => {
    store.categories = store.categories.map((category) =>
      category.id === id
        ? {
            ...category,
            name: input.name.trim(),
            emoji: clean(input.emoji),
            color: clean(input.color),
            sortOrder: input.sortOrder ?? category.sortOrder
          }
        : category
    );
  });

export const deleteCategory = async (id: string) =>
  updateStore((store) => {
    store.categories = store.categories.filter((category) => category.id !== id);
    store.phrases = store.phrases.map((phrase) =>
      phrase.categoryId === id ? { ...phrase, categoryId: null } : phrase
    );
  });

export const addHistoryItem = async (text: string) =>
  updateStore((store) => {
    store.history = sortHistory([
      {
        id: makeId("history"),
        text: text.trim(),
        spokenAt: nowIso()
      },
      ...store.history
    ]);
  });

export const clearHistory = async () =>
  updateStore((store) => {
    store.history = [];
  });

export const exportLibrary = async (): Promise<ExportPayload> => {
  const store = await readStore();
  return {
    version: 1,
    exportedAt: nowIso(),
    categories: sortCategories(store.categories),
    phrases: sortPhrases(store.phrases)
  };
};

export const importLibrary = async (payload: ExportPayload) => {
  if (payload.version !== 1 || !Array.isArray(payload.categories) || !Array.isArray(payload.phrases)) {
    throw new Error("This is not a SpeakEasy backup file.");
  }

  await updateStore((store) => {
    const categories = new Map(store.categories.map((category) => [category.id, category]));
    const phrases = new Map(store.phrases.map((phrase) => [phrase.id, phrase]));

    for (const category of payload.categories) {
      categories.set(category.id, category);
    }

    for (const phrase of payload.phrases) {
      phrases.set(phrase.id, phrase);
    }

    store.categories = sortCategories([...categories.values()]);
    store.phrases = sortPhrases([...phrases.values()]);
  });
};
