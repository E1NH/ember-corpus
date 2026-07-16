import fs from "node:fs";
import path from "node:path";
import { PATHS, BASE_URL } from "./config.js";

// Emits the exact contract the Android app consumes (Update Directive #2, Part 3).
export function writeManifest(corpus) {
  const manifest = {
    manifest_version: 1,
    generated_at: new Date().toISOString(),
    mockups: corpus.map((r) => ({
      id: r.id,
      image_url: BASE_URL ? `${BASE_URL}/images/${path.basename(r.file)}` : null,
      source_url: r.source_url,
      metadata: r.metadata,
    })),
  };
  fs.writeFileSync(PATHS.manifest, JSON.stringify(manifest, null, 2));
  return manifest.mockups.length;
}
