import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import { ENUMS, COMPONENTS, GEMINI_MODEL } from "./config.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema = {
  type: "object",
  properties: {
    color_palette: {
      type: "object",
      properties: {
        primary: { type: "string" }, secondary: { type: "string" },
        accent: { type: "string" }, background: { type: "string" },
      },
      required: ["primary", "secondary", "accent", "background"],
    },
    contrast_ratio: { type: "string", enum: ENUMS.contrast_ratio },
    typography_style: { type: "string", enum: ENUMS.typography_style },
    border_radius: { type: "integer", enum: ENUMS.border_radius },
    layout_grid: { type: "string", enum: ENUMS.layout_grid },
    ui_density: { type: "string", enum: ENUMS.ui_density },
    shadow_style: { type: "string", enum: ENUMS.shadow_style },
    component_types: { type: "array", items: { type: "string", enum: COMPONENTS } },
  },
  required: ["color_palette", "contrast_ratio", "typography_style", "border_radius", "layout_grid", "ui_density", "shadow_style", "component_types"],
};

const PROMPT = "You are a strict design-system auditor. Analyze this mobile UI screenshot and emit ONLY the JSON metadata. Hex codes must be 6-digit uppercase like #1A2B3C. border_radius is the dominant corner radius bucket in dp. component_types lists only clearly visible elements.";

export async function tagImage(filePath, retries = 4) {
  const data = fs.readFileSync(filePath).toString("base64");
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/webp", data } }, { text: PROMPT }] }],
        config: { responseMimeType: "application/json", responseSchema },
      });
      return JSON.parse(res.text);
    } catch (e) {
      if (attempt >= retries) throw e;
      const wait = Math.min(60000, 2 ** attempt * 5000);
      console.warn(`tagging retry in ${wait}ms: ${e.message}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

const HEX = /^#[0-9A-Fa-f]{6}$/;
// Belt-and-braces validation: responseSchema should guarantee this, but nothing unvalidated enters the corpus.
export function validate(meta) {
  const errs = [];
  for (const k of ["primary", "secondary", "accent", "background"])
    if (!HEX.test(meta?.color_palette?.[k] ?? "")) errs.push(`bad hex: ${k}`);
  for (const [field, allowed] of Object.entries(ENUMS))
    if (!allowed.includes(meta?.[field])) errs.push(`bad enum: ${field}=${meta?.[field]}`);
  if (!Array.isArray(meta?.component_types) || meta.component_types.some((c) => !COMPONENTS.includes(c)))
    errs.push("bad component_types");
  return errs;
}
