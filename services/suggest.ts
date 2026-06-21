import { isListenBackendConfigured, SUPABASE_ANON_KEY, suggestEndpoint } from "@/constants/config";
import type { ConversationTurn, Phrase } from "@/types";

// Keep context bounded so requests stay small and fast.
const MAX_TURNS = 12;

export type SuggestParams = {
  conversation: ConversationTurn[];
  language?: string;
  phrases?: Phrase[];
};

// Sends the recent conversation (both the partner's speech and the replies the
// user has spoken) to the Supabase Edge Function, which asks the AI for short
// replies the AAC user can tap to speak next. We pass a few of the user's own
// saved phrases so suggestions match their voice and vocabulary.
export const fetchSuggestions = async ({ conversation, language, phrases }: SuggestParams): Promise<string[]> => {
  const recent = conversation.filter((turn) => turn.text.trim()).slice(-MAX_TURNS);
  if (recent.length === 0) {
    return [];
  }

  if (!isListenBackendConfigured()) {
    throw new Error(
      "Listen backend not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (see LISTEN_SETUP.md)."
    );
  }

  const favorites = (phrases ?? [])
    .filter((phrase) => phrase.isQuickAccess || phrase.isPinned)
    .map((phrase) => phrase.text)
    .slice(0, 12);

  const response = await fetch(suggestEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ conversation: recent, language, favorites })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Suggestion request failed (${response.status}). ${detail}`.trim());
  }

  const data = (await response.json()) as { suggestions?: unknown };
  if (!Array.isArray(data.suggestions)) {
    return [];
  }

  return data.suggestions
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};
