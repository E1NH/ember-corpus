// Single source of truth for the schema contract shared with the Android app (MockupEntity).
export const ENUMS = {
  contrast_ratio: ["high", "medium", "muted", "monochromatic"],
  typography_style: ["brutalist_sans", "geometric_sans", "humanist_sans", "classic_serif", "modern_serif", "monospace", "display"],
  border_radius: [0, 4, 8, 12, 16, 24, 999],
  layout_grid: ["bento", "asymmetric", "standard_12col", "single_column", "split_screen", "card_list"],
  ui_density: ["sparse", "balanced", "dense"],
  shadow_style: ["flat", "soft", "hard", "neumorphic", "glass"],
};
export const COMPONENTS = ["navbar", "bottom_nav", "fab", "card", "data_table", "chart", "hero", "sidebar", "form", "chip", "avatar_stack", "search_bar", "tab_bar", "modal", "list_item"];

// Diversity admission gate tuning
export const QUOTA = {
  floor: 0.05,           // every enum value should hold >= 5% of corpus; candidates filling a starved bucket are always admitted
  ceiling: 0.45,         // a candidate overrepresented (>45%) on EVERY feature is rejected
  minCorpusForGate: 60,  // below this size, admit everything (bootstrap phase)
};

export const PATHS = {
  db: "corpus/data.json",
  quarantine: "corpus/quarantine.json",
  imagesDir: "docs/images",          // served by GitHub Pages (Settings > Pages > /docs)
  manifest: "docs/manifest.json",
  seeds: "seeds.json",
};

export const BASE_URL = (process.env.BASE_URL || "").replace(/\/$/, ""); // e.g. https://<user>.github.io/<repo>
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
export const MAX_CAPTURES = parseInt(process.env.MAX_CAPTURES || "40", 10);
export const HAMMING_THRESHOLD = 8;   // dHash distance <= 8 (of 64 bits) => near-duplicate
export const VLM_SPACING_MS = 5000;   // free-tier politeness between Gemini calls
