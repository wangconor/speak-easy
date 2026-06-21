export type Category = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
};

export type Phrase = {
  id: string;
  text: string;
  label: string | null;
  emoji: string | null;
  color: string | null;
  categoryId: string | null;
  voiceId: string | null;
  language: string | null;
  isPinned: boolean;
  isQuickAccess: boolean;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
};

export type PhraseInput = {
  text: string;
  label?: string | null;
  emoji?: string | null;
  color?: string | null;
  categoryId?: string | null;
  voiceId?: string | null;
  language?: string | null;
  isPinned?: boolean;
  isQuickAccess?: boolean;
  sortOrder?: number;
  isDefault?: boolean;
};

export type CategoryInput = {
  name: string;
  emoji?: string | null;
  color?: string | null;
  sortOrder?: number;
  isDefault?: boolean;
};

export type HistoryItem = {
  id: string;
  text: string;
  spokenAt: string;
};

export type SpeechSettings = {
  language: string;
  voiceId: string | null;
  rate: number;
  pitch: number;
};

export type ConversationTurn = {
  // "partner" = the other person (heard via the mic); "me" = the AAC user (a reply they spoke).
  role: "partner" | "me";
  text: string;
};

export type ListenSettings = {
  // Language to recognize the conversation partner's speech in.
  language: string;
  // Automatically fetch AI suggestions when a sentence is finalized.
  autoSuggest: boolean;
  // Whether the user has acknowledged the one-time listening/consent notice.
  hasConsented: boolean;
};

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  categories: Category[];
  phrases: Phrase[];
};
