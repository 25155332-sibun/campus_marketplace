const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateListingDetails(roughPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to .env.local");
  }

  const systemPrompt = `
You are an expert student marketplace assistant for an Indian university campus.
Your job is to take a student's brief/rough notes about an item they want to sell and generate a clean, attractive marketplace listing in strict JSON format.

Categories must be strictly one of: ["Books", "Cycles", "Electronics", "Others"].
Currency is in Indian Rupees (INR, ₹). Price must be a realistic number (integer or float).

Return ONLY valid JSON matching this schema:
{
  "title": "Clear, concise listing title (under 50 chars)",
  "category": "Books" | "Cycles" | "Electronics" | "Others",
  "suggestedPrice": 1500,
  "description": "Engaging, student-friendly description formatted cleanly with condition, features, and pickup notes."
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: `Student rough notes: "${roughPrompt}"` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Failed to generate details with AI');
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

  return JSON.parse(textOutput);
}

export async function analyzeMessageSafety(messageText) {
  if (!GEMINI_API_KEY) return null;

  const prompt = `
You are a real-time safety monitor for a university campus peer-to-peer marketplace.
Analyze this message sent between two college students: "${messageText}"

Check for:
1. OFF_PLATFORM_SCAM: Asking to pay via external suspicious links, gift cards, crypto, or asking for OTP/passwords.
2. RISKY_MEETUP: Proposing meetups outside the campus late at night or in secluded/isolated places.
3. SUSPICIOUS_CONTACT: Insisting immediately on off-platform chat (e.g. Telegram/WhatsApp) to bypass protections.

Return ONLY a valid JSON object matching this schema:
{
  "isRisky": boolean,
  "warningType": "SCAM" | "MEETUP" | "CONTACT" | null,
  "advice": "A short, friendly 1-sentence tip (max 15 words) for the student (e.g. 'Meet during daylight at SAC or Library.')" or null
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(textOutput);
  } catch (err) {
    console.error('Safety Sentinel error:', err);
    return null;
  }
}