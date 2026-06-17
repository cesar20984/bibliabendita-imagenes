import { fetchBibliabenditaPassage, getRandomBibliabenditaReference } from "./lib/bibliabendita.js";
import { generateImageCommentary } from "./lib/commentary.js";
import { generatePostPng } from "./generate.js";

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function createRandomFromSeed(seedValue) {
  if (!seedValue) return Math.random;

  let state = 2166136261;
  const seed = String(seedValue);

  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function isJsonRequest(input) {
  return input.format === "json" || input.debug === true || input.responseType === "json";
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const input = req.method === "POST" ? getBody(req) : req.query || {};
    const random = createRandomFromSeed(input.seed);
    const reference = getRandomBibliabenditaReference(random);
    const passage = await fetchBibliabenditaPassage(reference.url);
    const text = await generateImageCommentary(passage);

    if (isJsonRequest(input)) {
      res.status(200).json({
        ok: true,
        endpoint: `${req.method} /api/generate-random`,
        text,
        reference: passage.reference || passage.title || "Biblia",
        source: {
          ...reference,
          sourceUrl: reference.url,
          title: passage.title,
          verseText: passage.verseText,
          quickSummary: passage.quickSummary,
          shortReflection: passage.shortReflection,
          explanationIntro: passage.explanationIntro,
        },
      });
      return;
    }

    const png = await generatePostPng({
      text,
      reference: passage.reference || passage.title || "Biblia",
      style: input.style ? String(input.style) : undefined,
      seed: input.seed ? String(input.seed) : undefined,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", 'inline; filename="bibliabendita-random.png"');
    res.status(200).send(Buffer.from(png));
  } catch (error) {
    res.status(500).json({
      error: "Could not generate random Bibliabendita image",
      detail: error.message,
    });
  }
}
