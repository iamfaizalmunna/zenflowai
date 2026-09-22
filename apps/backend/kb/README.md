# Owned knowledge pack

This folder is the **demo Help Center**. It is committed so a clone can `pnpm db:seed` and Nova can answer without running a scraper.

Do not put scrape dumps, `.gguf` models, or the Ollama binary here. GitHub rejects files over 100MB. Splitting dummy data into ~90MB files still bloated every clone and is not how this pack ships. Keep articles as small markdown. If a future corpus is large, split **real** text under 90MB per file — never pad.

Raw ingest cache (this machine only): `data/kb/` at the repo root (gitignored).
