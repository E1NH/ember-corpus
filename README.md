# Ember Corpus — ingestion pipeline for Ember Swipe

Weekly GitHub Actions run: capture mobile screenshots of seed URLs -> pHash dedup ->
Gemini metadata tagging (strict schema) -> diversity admission gate -> publish
`docs/manifest.json` + images via GitHub Pages. Zero hosting cost.

## Setup (once)
1. Create a GitHub repo from this folder, push.
2. Settings > Pages: deploy from branch, folder `/docs`.
3. Settings > Secrets and variables > Actions:
   - Secret `GEMINI_API_KEY` (from Google AI Studio).
   - Variable `BASE_URL` = `https://<user>.github.io/<repo>` .
   - Optional variable `GEMINI_MODEL` (defaults to `gemini-flash-latest`).
4. Edit `seeds.json` — bucketed URL lists. Keep buckets stylistically opinionated;
   variety in equals variety out.
5. Run the workflow manually once (Actions > Ingest corpus > Run workflow).

## Point the app at it
In Ember Swipe's hidden dev dialog set the manifest URL to:
`https://<user>.github.io/<repo>/manifest.json`

## Tuning
- `MAX_CAPTURES` (workflow env): captures per run, keeps runs comfortably inside free-tier Gemini quotas.
- `src/config.js` QUOTA: floor/ceiling for the diversity gate; watch the STARVED lines in the run log and add seed URLs for starved styles.
- `corpus/quarantine.json`: failed/invalid entries, never published.

## Legal note
Seeds should be product sites you're comfortable screenshotting for a private research corpus.
Do not point this at design galleries whose ToS prohibit automated access.
