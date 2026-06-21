// Configuration for the "Listen" feature's AI backend.
//
// The reply suggestions are produced by Claude, called from a Supabase Edge
// Function (so the Anthropic API key stays server-side). Point the app at your
// deployed function by setting these in a `.env` file at the project root:
//
//   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
//
// Expo inlines any `EXPO_PUBLIC_*` variable at build time. See LISTEN_SETUP.md.

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const SUGGEST_FUNCTION = "suggest-replies";

export const isListenBackendConfigured = () => SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 0;

export const suggestEndpoint = () => `${SUPABASE_URL}/functions/v1/${SUGGEST_FUNCTION}`;
