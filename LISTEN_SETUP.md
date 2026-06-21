# Listen feature — setup

"Listen" lets the app follow a conversation through the microphone and suggest
short replies (powered by Google Gemini) that the user can tap to speak aloud —
like smart replies in email or texting.

It has two pieces:

1. **Live speech-to-text** — `expo-speech-recognition`, which works on Web,
   iOS 17+, and Android 12+.
2. **AI reply suggestions** — a Supabase Edge Function (`suggest-replies`) that
   calls the Gemini API, keeping your Gemini key server-side.

---

## 1. Install the dependency

```bash
pnpm add expo-speech-recognition@56.0.1
```

This library uses **Expo-SDK-aligned versions**, so on SDK 56 you need the
`56.x` release (the plain `latest`/`2.x`/`3.x` tags target older SDKs — `npx
expo install` will NOT pick the right one because the package isn't in Expo's
managed list). `package.json` and `app.json` already reference it.

### Where it runs

- **Web** (`npx expo start --web`): works immediately in Chrome / Safari 16+.
  Best way to try the feature right now.
- **iOS / Android**: speech recognition needs native code, so it does **not**
  run in Expo Go. Generate a dev build:

  ```bash
  npx expo run:ios     # or: npx expo run:android
  ```

---

## 2. Deploy the AI backend (Supabase)

You need an active Supabase project (the function is in
`supabase/functions/suggest-replies/`).

```bash
# from the project root
supabase login
supabase link --project-ref <your-project-ref>

# store your Gemini key as a function secret (never goes in the app)
# get a free key at https://aistudio.google.com/apikey
supabase secrets set GEMINI_API_KEY=...

# deploy the function
supabase functions deploy suggest-replies
```

The function uses Google **`gemini-2.5-flash`** (free tier). To change models,
edit `MODEL` near the top of `supabase/functions/suggest-replies/index.ts`
(e.g. `gemini-flash-latest` or `gemini-3.5-flash`) and redeploy.

---

## 3. Point the app at your project

Copy `.env.example` to `.env` and fill in your project URL and **anon** key
(Supabase dashboard → Project Settings → API):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

Restart `expo start` so the new env vars are picked up.

---

## How it works

1. Tap **Start listening** on the Listen tab. The other person's speech is
   transcribed live and shown under "Heard".
2. When a sentence finishes, the transcript is sent to the `suggest-replies`
   function, which asks Gemini for ~5 short replies (and passes along a few of
   your pinned/quick-access phrases so suggestions match your voice).
3. Tap a suggestion to speak it aloud; long-press to save it as a phrase.

A one-time consent notice is shown before the microphone can be enabled, since
listening records a second person's voice. Toggle "Suggest replies
automatically" off on the Listen tab to fetch suggestions only via the
**Refresh** button.
