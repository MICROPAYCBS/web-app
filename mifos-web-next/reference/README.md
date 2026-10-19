# Reference repositories

Optional local clones (gitignored). **New screens do not require Angular.**

```bash
# Prefer the sibling Micropay Fineract tree when present (`../fineract`).
git clone --depth 1 --branch develop https://github.com/apache/fineract.git fineract

# Frozen archive only — not a living spec.
git clone --depth 1 --branch develop https://github.com/openMF/web-app.git web-app
```

- **fineract** — validation and API source of truth
- **web-app** — frozen Angular inventory (see [`docs/parity/FROZEN.md`](../docs/parity/FROZEN.md))
