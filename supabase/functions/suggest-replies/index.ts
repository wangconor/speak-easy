// Supabase Edge Function: suggest-replies
//
// Receives the recent conversation (the partner's speech heard via the mic and
// the replies the AAC user has spoken) and returns a few short replies the user
// can tap to say next. Calls the Google Gemini API with the API key kept
// server-side (set as a function secret), so the key is never shipped in the app.
//
// Deploy:
//   supabase functions deploy suggest-replies
//   supabase secrets set GEMINI_API_KEY=...
// Get a free key at https://aistudio.google.com/apikey . See LISTEN_SETUP.md.

// gemini-2.5-flash has a generous free tier. Alternatives (one-line swap):
//   "gemini-flash-latest" (always newest Flash) or "gemini-3.5-flash".
const MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Keep context bounded so requests stay small and fast.
const MAX_TURNS = 12;

type Turn = { role: "partner" | "me"; text: string };

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json({ error: "GEMINI_API_KEY is not configured on the function" }, 500);
  }

  let body: { conversation?: unknown; transcript?: unknown; language?: unknown; favorites?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const conversation: Turn[] = (Array.isArray(body.conversation) ? body.conversation : [])
    .map((item): Turn => ({
      role: item && typeof item === "object" && (item as { role?: unknown }).role === "me" ? "me" : "partner",
      text:
        item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string"
          ? ((item as { text: string }).text).trim()
          : ""
    }))
    .filter((turn) => turn.text)
    .slice(-MAX_TURNS);

  // Back-compat: accept a single `transcript` string as one partner turn.
  if (conversation.length === 0 && typeof body.transcript === "string" && body.transcript.trim()) {
    conversation.push({ role: "partner", text: body.transcript.trim() });
  }

  if (conversation.length === 0) {
    return json({ suggestions: [] });
  }

  const language = typeof body.language === "string" && body.language ? body.language : "en-US";
  const favorites = Array.isArray(body.favorites)
    ? body.favorites.filter((item): item is string => typeof item === "string").slice(0, 12)
    : [];

  const transcriptText = conversation
    .map((turn) => (turn.role === "me" ? `Me (AAC user): ${turn.text}` : `Them: ${turn.text}`))
    .join("\n");

  const system = `You help a person who uses an AAC (augmentative and alternative communication) app to speak. They cannot speak easily, so you suggest short replies they can tap to say out loud.

You are given the recent back-and-forth of a real conversation. Lines marked "Them:" are the other person (heard through the microphone); lines marked "Me (AAC user):" are what the person you are helping has already said.

Suggest 5 short, natural replies the AAC user could say NEXT. Take the WHOLE conversation into account for context (names, topics, questions already answered), and respond to the most recent "Them:" line.

Rules:
- Write in the first person, as the AAC user speaking.
- Keep each reply short (1-8 words) and easy to say out loud.
- Use the conversation context: don't repeat what was already said, and stay on topic.
- Offer a useful range: for example a yes, a no, a clarifying question, and a couple of common responses that fit.
- Reply in this language: ${language}.
- Do not include quotation marks, emoji, or numbering.

Return ONLY a JSON object of the form {"suggestions": ["reply one", "reply two", ...]}.`;

  const userContent = `Here is the recent conversation (most recent last):

${transcriptText}

Suggest 5 short replies I (the AAC user) could say next.${
    favorites.length
      ? `\n\nPhrases I say often (match my tone and vocabulary when it fits):\n${favorites.map((item) => `- ${item}`).join("\n")}`
      : ""
  }`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 512,
          // Disable Flash's default "thinking" for faster, cheaper live replies.
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });
  } catch (fetchError) {
    return json({ error: `Failed to reach Gemini API: ${String(fetchError)}` }, 502);
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text().catch(() => "");
    return json({ error: `Gemini API error (${geminiRes.status})`, detail }, 502);
  }

  const data = await geminiRes.json();
  const text: string = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part: { text?: string }) => part.text ?? "")
    .join("");

  let suggestions: string[] = [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      suggestions = parsed;
    } else if (Array.isArray(parsed.suggestions)) {
      suggestions = parsed.suggestions;
    }
  } catch {
    // Fallback: treat the response as a newline list if JSON parsing failed.
    suggestions = text.split("\n").map((line) => line.replace(/^[-*\d.\s]+/, "").trim());
  }

  suggestions = suggestions.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 6);

  return json({ suggestions });
});
