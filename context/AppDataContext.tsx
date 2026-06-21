import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import { pickBackupFile, shareBackupFile } from "@/services/backup";
import {
  addHistoryItem,
  clearHistory,
  createCategory as createCategoryRecord,
  createPhrase as createPhraseRecord,
  deleteCategory as deleteCategoryRecord,
  deletePhrase as deletePhraseRecord,
  exportLibrary,
  fetchCategories,
  fetchHistory,
  fetchPhrases,
  importLibrary,
  initializeDatabase,
  reorderPhrases as reorderPhraseRecords,
  updateCategory as updateCategoryRecord,
  updatePhrase as updatePhraseRecord
} from "@/services/database";
import { getAvailableVoices, speakPhrase as speakPhraseOutLoud, speakText as speakTextOutLoud, Voice } from "@/services/speech";
import type { Category, CategoryInput, HistoryItem, ListenSettings, Phrase, PhraseInput, SpeechSettings } from "@/types";

const SETTINGS_KEY = "speakeasy.speechSettings.v1";
const LISTEN_KEY = "speakeasy.listenSettings.v1";

export const defaultSpeechSettings: SpeechSettings = {
  language: "en-US",
  voiceId: null,
  rate: 0.95,
  pitch: 1
};

export const defaultListenSettings: ListenSettings = {
  language: "en-US",
  autoSuggest: true,
  hasConsented: false
};

type State = {
  ready: boolean;
  loading: boolean;
  error: string | null;
  categories: Category[];
  phrases: Phrase[];
  history: HistoryItem[];
  settings: SpeechSettings;
  listen: ListenSettings;
  voices: Voice[];
};

type Action =
  | { type: "loading" }
  | {
      type: "hydrate";
      categories: Category[];
      phrases: Phrase[];
      history: HistoryItem[];
      settings: SpeechSettings;
      listen: ListenSettings;
      voices: Voice[];
    }
  | { type: "data"; categories: Category[]; phrases: Phrase[]; history: HistoryItem[] }
  | { type: "history"; history: HistoryItem[] }
  | { type: "settings"; settings: SpeechSettings }
  | { type: "listen"; listen: ListenSettings }
  | { type: "error"; error: string };

type AppDataValue = State & {
  quickAccess: Phrase[];
  reload: () => Promise<void>;
  addPhrase: (input: PhraseInput) => Promise<string>;
  savePhrase: (id: string, input: PhraseInput) => Promise<void>;
  patchPhrase: (id: string, patch: Partial<PhraseInput>) => Promise<void>;
  removePhrase: (id: string) => Promise<void>;
  reorderPhraseIds: (ids: string[]) => Promise<void>;
  addCategory: (input: CategoryInput) => Promise<string>;
  saveCategory: (id: string, input: CategoryInput) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  speakPhrase: (phrase: Phrase) => Promise<void>;
  speakFreeText: (text: string) => Promise<void>;
  updateSettings: (patch: Partial<SpeechSettings>) => Promise<void>;
  updateListenSettings: (patch: Partial<ListenSettings>) => Promise<void>;
  exportData: () => Promise<string>;
  importData: () => Promise<boolean>;
  clearScratchpadHistory: () => Promise<void>;
};

const initialState: State = {
  ready: false,
  loading: true,
  error: null,
  categories: [],
  phrases: [],
  history: [],
  settings: defaultSpeechSettings,
  listen: defaultListenSettings,
  voices: []
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, error: null };
    case "hydrate":
      return {
        ...state,
        ready: true,
        loading: false,
        error: null,
        categories: action.categories,
        phrases: action.phrases,
        history: action.history,
        settings: action.settings,
        listen: action.listen,
        voices: action.voices
      };
    case "data":
      return {
        ...state,
        ready: true,
        loading: false,
        error: null,
        categories: action.categories,
        phrases: action.phrases,
        history: action.history
      };
    case "history":
      return { ...state, history: action.history };
    case "settings":
      return { ...state, settings: action.settings };
    case "listen":
      return { ...state, listen: action.listen };
    case "error":
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};

const AppDataContext = createContext<AppDataValue | undefined>(undefined);

const normalizeSettings = (value: string | null): SpeechSettings => {
  if (!value) {
    return defaultSpeechSettings;
  }

  try {
    const parsed = JSON.parse(value) as Partial<SpeechSettings>;
    return {
      language: parsed.language || defaultSpeechSettings.language,
      voiceId: parsed.voiceId ?? null,
      rate: typeof parsed.rate === "number" ? parsed.rate : defaultSpeechSettings.rate,
      pitch: typeof parsed.pitch === "number" ? parsed.pitch : defaultSpeechSettings.pitch
    };
  } catch {
    return defaultSpeechSettings;
  }
};

const normalizeListen = (value: string | null): ListenSettings => {
  if (!value) {
    return defaultListenSettings;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ListenSettings>;
    return {
      language: parsed.language || defaultListenSettings.language,
      autoSuggest: typeof parsed.autoSuggest === "boolean" ? parsed.autoSuggest : defaultListenSettings.autoSuggest,
      hasConsented: typeof parsed.hasConsented === "boolean" ? parsed.hasConsented : defaultListenSettings.hasConsented
    };
  } catch {
    return defaultListenSettings;
  }
};

const phraseToInput = (phrase: Phrase, patch: Partial<PhraseInput> = {}): PhraseInput => ({
  text: patch.text ?? phrase.text,
  label: patch.label ?? phrase.label,
  emoji: patch.emoji ?? phrase.emoji,
  color: patch.color ?? phrase.color,
  categoryId: patch.categoryId ?? phrase.categoryId,
  voiceId: patch.voiceId ?? phrase.voiceId,
  language: patch.language ?? phrase.language,
  isPinned: patch.isPinned ?? phrase.isPinned,
  isQuickAccess: patch.isQuickAccess ?? phrase.isQuickAccess,
  sortOrder: patch.sortOrder ?? phrase.sortOrder,
  isDefault: patch.isDefault ?? phrase.isDefault
});

const sortQuickAccess = (phrases: Phrase[]) =>
  [...phrases]
    .filter((phrase) => phrase.isQuickAccess)
    .sort((left, right) => {
      if (left.isPinned !== right.isPinned) {
        return left.isPinned ? -1 : 1;
      }
      return left.sortOrder - right.sortOrder;
    })
    .slice(0, 6);

const withTimeout = async <T,>(promise: Promise<T>, fallback: T, timeoutMs = 1800) =>
  Promise.race<T>([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    })
  ]);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadAll = useCallback(async () => {
    dispatch({ type: "loading" });
    try {
      await initializeDatabase();
      const [categories, phrases, history, storedSettings, storedListen, voices] = await Promise.all([
        fetchCategories(),
        fetchPhrases(),
        fetchHistory(),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(LISTEN_KEY),
        withTimeout(getAvailableVoices().catch(() => []), [])
      ]);

      dispatch({
        type: "hydrate",
        categories,
        phrases,
        history,
        settings: normalizeSettings(storedSettings),
        listen: normalizeListen(storedListen),
        voices
      });
    } catch (error) {
      dispatch({ type: "error", error: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  const refreshData = useCallback(async () => {
    const [categories, phrases, history] = await Promise.all([
      fetchCategories(),
      fetchPhrases(),
      fetchHistory()
    ]);
    dispatch({ type: "data", categories, phrases, history });
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addPhrase = useCallback(
    async (input: PhraseInput) => {
      const id = await createPhraseRecord(input);
      await refreshData();
      return id;
    },
    [refreshData]
  );

  const savePhrase = useCallback(
    async (id: string, input: PhraseInput) => {
      await updatePhraseRecord(id, input);
      await refreshData();
    },
    [refreshData]
  );

  const patchPhrase = useCallback(
    async (id: string, patch: Partial<PhraseInput>) => {
      const phrase = state.phrases.find((item) => item.id === id);
      if (!phrase) {
        return;
      }
      await updatePhraseRecord(id, phraseToInput(phrase, patch));
      await refreshData();
    },
    [refreshData, state.phrases]
  );

  const removePhrase = useCallback(
    async (id: string) => {
      await deletePhraseRecord(id);
      await refreshData();
    },
    [refreshData]
  );

  const reorderPhraseIds = useCallback(
    async (ids: string[]) => {
      await reorderPhraseRecords(ids);
      await refreshData();
    },
    [refreshData]
  );

  const addCategory = useCallback(
    async (input: CategoryInput) => {
      const id = await createCategoryRecord(input);
      await refreshData();
      return id;
    },
    [refreshData]
  );

  const saveCategory = useCallback(
    async (id: string, input: CategoryInput) => {
      await updateCategoryRecord(id, input);
      await refreshData();
    },
    [refreshData]
  );

  const removeCategory = useCallback(
    async (id: string) => {
      await deleteCategoryRecord(id);
      await refreshData();
    },
    [refreshData]
  );

  const speakPhrase = useCallback(
    async (phrase: Phrase) => {
      await speakPhraseOutLoud(phrase, state.settings);
    },
    [state.settings]
  );

  const speakFreeText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      await speakTextOutLoud(trimmed, state.settings);
      await addHistoryItem(trimmed);
      dispatch({ type: "history", history: await fetchHistory() });
    },
    [state.settings]
  );

  const updateSettings = useCallback(
    async (patch: Partial<SpeechSettings>) => {
      const next = { ...state.settings, ...patch };
      dispatch({ type: "settings", settings: next });
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    },
    [state.settings]
  );

  const updateListenSettings = useCallback(
    async (patch: Partial<ListenSettings>) => {
      const next = { ...state.listen, ...patch };
      dispatch({ type: "listen", listen: next });
      await AsyncStorage.setItem(LISTEN_KEY, JSON.stringify(next));
    },
    [state.listen]
  );

  const exportData = useCallback(async () => {
    const payload = await exportLibrary();
    return shareBackupFile(payload);
  }, []);

  const importData = useCallback(async () => {
    const payload = await pickBackupFile();
    if (!payload) {
      return false;
    }
    await importLibrary(payload);
    await refreshData();
    return true;
  }, [refreshData]);

  const clearScratchpadHistory = useCallback(async () => {
    await clearHistory();
    dispatch({ type: "history", history: [] });
  }, []);

  const quickAccess = useMemo(() => sortQuickAccess(state.phrases), [state.phrases]);

  const value = useMemo<AppDataValue>(
    () => ({
      ...state,
      quickAccess,
      reload: loadAll,
      addPhrase,
      savePhrase,
      patchPhrase,
      removePhrase,
      reorderPhraseIds,
      addCategory,
      saveCategory,
      removeCategory,
      speakPhrase,
      speakFreeText,
      updateSettings,
      updateListenSettings,
      exportData,
      importData,
      clearScratchpadHistory
    }),
    [
      addCategory,
      addPhrase,
      clearScratchpadHistory,
      exportData,
      importData,
      loadAll,
      patchPhrase,
      quickAccess,
      removeCategory,
      removePhrase,
      reorderPhraseIds,
      saveCategory,
      savePhrase,
      speakFreeText,
      speakPhrase,
      state,
      updateSettings,
      updateListenSettings
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
};
