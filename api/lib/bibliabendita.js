import { load } from "cheerio";
import { bible, bibleBooks } from "./bible-data.js";

const BASE_URL = "https://bibliabendita.com";

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function extractSectionText($, heading) {
  if (!heading.length) return "";

  const parts = [];
  let current = heading.next();

  while (current.length) {
    if (/^h[1-6]$/i.test(current[0].tagName || "")) break;
    const text = normalizeWhitespace(current.text() || "");
    if (text) parts.push(text);
    current = current.next();
  }

  return parts.join("\n\n").trim();
}

export function buildBibliabenditaUrl(bookSlug, chapter, verse) {
  const normalizedBook = String(bookSlug || "").trim().toLowerCase();
  const chapterNumber = Number(chapter);
  const verseNumber = Number(verse);
  const bookData = bible[normalizedBook];

  if (!bookData) {
    throw new Error(`Unknown Bible book slug: ${normalizedBook}`);
  }

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > bookData[0]) {
    throw new Error(`Invalid chapter ${chapter} for ${normalizedBook}`);
  }

  const maxVerse = bookData[1][chapterNumber - 1];
  if (!Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > maxVerse) {
    throw new Error(`Invalid verse ${verse} for ${normalizedBook} ${chapterNumber}`);
  }

  return `${BASE_URL}/${normalizedBook}/${normalizedBook}-${chapterNumber}-${verseNumber}`;
}

export function getRandomBibliabenditaReference(random = Math.random) {
  const bookSlug = bibleBooks[Math.floor(random() * bibleBooks.length)];
  const [chapterCount, versesByChapter] = bible[bookSlug];
  const chapter = Math.floor(random() * chapterCount) + 1;
  const verse = Math.floor(random() * versesByChapter[chapter - 1]) + 1;

  return {
    bookSlug,
    chapter,
    verse,
    url: buildBibliabenditaUrl(bookSlug, chapter, verse),
  };
}

export async function fetchBibliabenditaPassage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 BibliabenditaImageBot/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch Bibliabendita page: ${response.status}`);
  }

  const html = await response.text();
  const $ = load(html);

  $("script, style, noscript").remove();

  const title = normalizeWhitespace($("h1").first().text() || "");
  const verseHeading = $("h2")
    .filter((_, element) => normalizeWhitespace($(element).text()).includes("Vers"))
    .first();
  const verseBlock = $("#versiculo-literal").first();
  const questionHeading = $("h2")
    .filter((_, element) => normalizeWhitespace($(element).text()).includes("significa"))
    .first();
  const shortReflectionHeading = $("h2")
    .filter((_, element) => normalizeWhitespace($(element).text()).includes("Reflex"))
    .first();
  const articleHeading = $("h2")
    .filter((_, element) => normalizeWhitespace($(element).text()).match(/^.+ - .+/))
    .first();

  let quickSummary = "";
  $("h1, h2, h3, h4, h5, h6").each((_, element) => {
    const text = normalizeWhitespace($(element).text() || "");
    if (text.toLowerCase().includes("resumen") && text.toLowerCase().includes("contenido")) {
      quickSummary = normalizeWhitespace(
        ($(element).next().text() || "") + " " + ($(element).next().next().text() || ""),
      );
      return false;
    }
    return undefined;
  });

  const reference = normalizeWhitespace(verseBlock.find("cite").first().text() || "") || title;
  const verseText = normalizeWhitespace(verseBlock.find("strong").first().text() || "")
    .replace(/^['"`]+|['"`]+$/g, "");

  return {
    url,
    title,
    reference,
    verseText,
    quickSummary,
    explanationIntro: extractSectionText($, questionHeading),
    shortReflection: extractSectionText($, shortReflectionHeading),
    article: extractSectionText($, articleHeading),
  };
}
