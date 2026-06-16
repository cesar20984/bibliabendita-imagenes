import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDir = join(process.cwd(), "tmp");
const outputPath = join(outputDir, "api-sample.png");

process.env.XDG_CACHE_HOME = outputDir;
process.env.LOCALAPPDATA = outputDir;

const { generatePostPng } = await import("../api/generate.js");

const png = await generatePostPng({
  text: "Dios sostiene tu camino aun cuando no ves el final. Su palabra enciende esperanza para avanzar con paz.",
  reference: "Salmos 32:8",
  seed: "sample-api",
});

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, png);

console.log(`Imagen generada: ${outputPath}`);
