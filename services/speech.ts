import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

import type { Phrase, SpeechSettings } from "@/types";

export type Voice = Speech.Voice;

type SpeechOverrides = {
  language?: string | null;
  voiceId?: string | null;
  rate?: number;
  pitch?: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const selectionFeedback = () => {
  Haptics.selectionAsync().catch(() => undefined);
};

export const getAvailableVoices = async () => Speech.getAvailableVoicesAsync();

export const stopSpeech = async () => {
  try {
    await Speech.stop();
  } catch {
    // Best effort only; speaking can fail if the native engine is unavailable.
  }
};

export const speakText = async (
  text: string,
  settings: SpeechSettings,
  overrides: SpeechOverrides = {}
) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  selectionFeedback();
  await stopSpeech();

  Speech.speak(trimmed, {
    language: overrides.language || settings.language,
    voice: overrides.voiceId || settings.voiceId || undefined,
    rate: clamp(overrides.rate ?? settings.rate, 0.1, 2),
    pitch: clamp(overrides.pitch ?? settings.pitch, 0.5, 2),
    useApplicationAudioSession: true
  });
};

export const speakPhrase = async (phrase: Phrase, settings: SpeechSettings) =>
  speakText(phrase.text, settings, {
    language: phrase.language,
    voiceId: phrase.voiceId
  });
