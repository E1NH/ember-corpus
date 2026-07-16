import fs from "node:fs";
import { PATHS, HAMMING_THRESHOLD, VLM_SPACING_MS } from "./config.js";
import { captureNew } from "./capture.js";
import { dHash, hamming } from "./hash.js";
import { tagImage, validate } from "./tag.js";
import { admit, coverageReport } from "./gate.js";
import { writeManifest } from "./manifest.js";

const load = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback);
const save = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2));

// git does not track empty directories; guarantee the working tree we expect.
fs.mkdirSync("corpus", { recursive: true });
fs.mkdirSync(PATHS.imagesDir, { recursive: true });
fs.mkdirSync("docs", { recursive: true });

const corpus = load(PATHS.db, []);
const quarantine = load(PATHS.quarantine, []);
const knownUrls = new Set([...corpus, ...quarantine].map((r) => r.source_url));

const captured = await captureNew(knownUrls);
const stats = { captured: captured.length, duplicates: 0, invalid: 0, gated: 0, admitted: 0 };

for (const rec of captured) {
  const hash = await dHash(rec.file);
  if (corpus.some((r) => hamming(r.hash, hash) <= HAMMING_THRESHOLD)) {
    fs.unlinkSync(rec.file); stats.duplicates++;
    console.log(`duplicate, dropped: ${rec.source_url}`);
    continue;
  }

  await new Promise((r) => setTimeout(r, VLM_SPACING_MS)); // free-tier spacing
  let metadata;
  try {
    metadata = await tagImage(rec.file);
  } catch (e) {
    console.warn(`tagging failed permanently, quarantined: ${rec.source_url}`);
    quarantine.push({ ...rec, error: String(e.message) }); fs.unlinkSync(rec.file);
    continue;
  }

  const errs = validate(metadata);
  if (errs.length) {
    quarantine.push({ ...rec, error: errs.join("; ") }); fs.unlinkSync(rec.file); stats.invalid++;
    console.warn(`invalid metadata, quarantined: ${rec.source_url} (${errs.join("; ")})`);
    continue;
  }

  const verdict = admit(corpus, metadata);
  if (!verdict.ok) {
    fs.unlinkSync(rec.file); stats.gated++;
    console.log(`gate rejected (${verdict.reason}): ${rec.source_url}`);
    continue;
  }

  corpus.push({ ...rec, hash, metadata, captured_at: new Date().toISOString(), admitted: verdict.reason });
  stats.admitted++;
  console.log(`admitted (${verdict.reason}): ${rec.source_url}`);
}

save(PATHS.db, corpus);
save(PATHS.quarantine, quarantine);
const published = writeManifest(corpus);

console.log(`\n=== run summary ===\n${JSON.stringify(stats, null, 2)}`);
console.log(`corpus size: ${corpus.length}, manifest entries: ${published}`);
console.log(`\n=== coverage ===\n${coverageReport(corpus)}`);
