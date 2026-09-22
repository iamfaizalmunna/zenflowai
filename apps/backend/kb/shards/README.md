# Temp testing shards (unique articles, not empty padding)

`pack-01.jsonl` is a **real article corpus** for temporary Q&A testing, kept under GitHub’s 100MB file cap (~88MB). Each line is a unique ZenFlow how-to (error code, browser, steps). Delete these files with the repo when testing is done.

Seed loads the markdown pack plus the first 400 shard articles into MySQL so Nova can answer without importing the whole file.
