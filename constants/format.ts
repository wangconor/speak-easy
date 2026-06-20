// Helpers for turning technical codes (BCP-47 language tags, hex colors,
// platform voice identifiers) into friendly, human-readable labels.

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  sv: "Swedish",
  pl: "Polish",
  tr: "Turkish",
  da: "Danish",
  fi: "Finnish",
  no: "Norwegian",
  cs: "Czech",
  el: "Greek"
};

const REGION_NAMES: Record<string, string> = {
  US: "US",
  GB: "UK",
  ES: "Spain",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  BR: "Brazil",
  PT: "Portugal",
  CN: "China",
  TW: "Taiwan",
  JP: "Japan",
  KR: "Korea",
  MX: "Mexico",
  CA: "Canada",
  AU: "Australia",
  IN: "India"
};

export function languageLabel(code: string | null | undefined): string {
  if (!code) {
    return "Default";
  }
  const [langRaw, regionRaw] = code.replace("_", "-").split("-");
  const lang = LANGUAGE_NAMES[(langRaw ?? "").toLowerCase()] ?? (langRaw ? langRaw.toUpperCase() : code);
  const region = regionRaw ? REGION_NAMES[regionRaw.toUpperCase()] ?? regionRaw.toUpperCase() : null;
  return region ? `${lang} (${region})` : lang;
}

// Older builds stored loud primary colors. Map them onto the current muted
// studio palette so previously-saved phrases/packs render consistently.
const LEGACY_COLOR_MAP: Record<string, string> = {
  "#2563EB": "#3F6E8C",
  "#059669": "#5C7A5A",
  "#D97706": "#B08443",
  "#DC2626": "#B05B4D",
  "#7C3AED": "#7A6485",
  "#0F766E": "#2F7E6B",
  "#BE123C": "#A86A78",
  "#4B5563": "#7C776C"
};

export function resolveColor(hex: string | null | undefined): string | null {
  if (!hex) {
    return null;
  }
  return LEGACY_COLOR_MAP[hex.toUpperCase()] ?? hex;
}

const COLOR_NAMES: Record<string, string> = {
  "#3F6E8C": "Blue",
  "#5C7A5A": "Green",
  "#B08443": "Amber",
  "#B05B4D": "Red",
  "#7A6485": "Purple",
  "#2F7E6B": "Teal",
  "#A86A78": "Rose",
  "#7C776C": "Gray"
};

export function colorName(hex: string): string {
  const resolved = (resolveColor(hex) ?? hex).toUpperCase();
  return COLOR_NAMES[resolved] ?? hex;
}

// Platform voice names are noisy: "com.apple.ttsbundle.Samantha-compact",
// "en-us-x-sfg#female_1-local", "Google US English". Strip vendor prefixes,
// technical tokens, and numbers to leave a clean, readable name.
const VOICE_NOISE = /\b(x|tts|ttsbundle|bundle|com|apple|google|microsoft|android|chromeos|local|network|compact|enhanced|premium|siri|lang|voice|synthesis|speech)\b/gi;

export function voiceLabel(voice: { name?: string | null; identifier?: string; language?: string | null }): string {
  const raw = voice.name || voice.identifier || "";
  let cleaned = raw;
  if (cleaned.includes("#")) {
    cleaned = cleaned.split("#")[0];
  }
  if (cleaned.includes(".")) {
    cleaned = cleaned.split(".").pop() ?? cleaned;
  }
  cleaned = cleaned
    .replace(/[-_]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(VOICE_NOISE, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return languageLabel(voice.language);
  }
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}
