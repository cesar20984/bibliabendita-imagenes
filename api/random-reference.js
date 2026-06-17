import { getRandomBibliabenditaReference } from "./lib/bibliabendita.js";

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

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.method === "POST" ? getBody(req) : req.query || {};
    const random = createRandomFromSeed(body.seed);
    const reference = getRandomBibliabenditaReference(random);

    res.status(200).json({
      ok: true,
      endpoint: `${req.method} /api/random-reference`,
      ...reference,
      sourceUrl: reference.url,
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not generate random reference",
      detail: error.message,
    });
  }
}
