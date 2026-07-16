import puppeteer from "puppeteer";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PATHS, MAX_CAPTURES } from "./config.js";

// Captures mobile-viewport screenshots for seed URLs not yet in the corpus.
// Output: 720px-wide WebP in docs/images, ~60-120 KB each.
export async function captureNew(existingUrls) {
  const seeds = JSON.parse(fs.readFileSync(PATHS.seeds, "utf8"));
  const queue = [];
  for (const [bucket, urls] of Object.entries(seeds))
    for (const url of urls)
      if (!existingUrls.has(url)) queue.push({ bucket, url });

  const batch = queue.slice(0, MAX_CAPTURES);
  if (batch.length === 0) return [];

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const results = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36");

    for (const { bucket, url } of batch) {
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
        await new Promise((r) => setTimeout(r, 3000)); // let hero animations settle
        const png = await page.screenshot({ type: "png" });
        const id = crypto.randomUUID();
        const file = path.join(PATHS.imagesDir, `${id}.webp`);
        await sharp(png).resize({ width: 720 }).webp({ quality: 80 }).toFile(file);
        results.push({ id, source_url: url, bucket, file });
        console.log(`captured ${url}`);
      } catch (e) {
        console.warn(`capture failed ${url}: ${e.message}`);
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}
