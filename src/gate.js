import { ENUMS, QUOTA } from "./config.js";

const FEATURES = Object.keys(ENUMS);

function share(corpus, field, value) {
  if (corpus.length === 0) return 0;
  return corpus.filter((r) => r.metadata[field] === value).length / corpus.length;
}

// Diversity admission gate: the corpus is a distribution over the feature space; enforce coverage.
// - bootstrap: admit everything while the corpus is small
// - fills_floor: always admit a candidate carrying any enum value below the 5% floor
// - overrepresented: reject a candidate whose value exceeds the ceiling on EVERY feature
export function admit(corpus, metadata) {
  if (corpus.length < QUOTA.minCorpusForGate) return { ok: true, reason: "bootstrap" };

  let fillsFloor = false;
  let allOverCeiling = true;
  for (const f of FEATURES) {
    const s = share(corpus, f, metadata[f]);
    if (s < QUOTA.floor) fillsFloor = true;
    if (s < QUOTA.ceiling) allOverCeiling = false;
  }
  if (fillsFloor) return { ok: true, reason: "fills_floor" };
  if (allOverCeiling) return { ok: false, reason: "overrepresented" };
  return { ok: true, reason: "neutral" };
}

// Printed after each run so starved buckets are visible in the Actions log.
export function coverageReport(corpus) {
  const lines = [];
  for (const [f, values] of Object.entries(ENUMS))
    for (const v of values) {
      const s = share(corpus, f, v);
      const flag = s < QUOTA.floor ? "  <-- STARVED" : "";
      lines.push(`${f}=${v}: ${(s * 100).toFixed(1)}%${flag}`);
    }
  return lines.join("\n");
}
