function firstSentences(text, maxSentences = 2) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, maxSentences)
    .join(" ")
    .trim();
}

function fallbackCommentary(data) {
  const fromSummary = firstSentences(data.quickSummary, 2);
  if (fromSummary) return fromSummary;

  const fromExplanation = firstSentences(data.explanationIntro, 2);
  if (fromExplanation) return fromExplanation;

  const fromReflection = firstSentences(data.shortReflection, 2);
  if (fromReflection) return fromReflection;

  return firstSentences(data.verseText, 1);
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const chunks = [];

  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

export async function generateImageCommentary(data) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackCommentary(data);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_output_tokens: 120,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Eres un redactor cristiano para redes sociales. Escribe un comentario breve, calido y reflexivo para una imagen de Instagram. No copies el versiculo completo. Debe sentirse humano, esperanzador y claro. Maximo 220 caracteres. No uses comillas ni emojis.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                reference: data.reference,
                verseText: data.verseText,
                quickSummary: data.quickSummary,
                explanationIntro: data.explanationIntro,
                shortReflection: data.shortReflection,
                sourceUrl: data.url,
              }),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    return fallbackCommentary(data);
  }

  const payload = await response.json();
  return extractOutputText(payload) || fallbackCommentary(data);
}
