# Extracting to a standalone repository

This project is bootstrapped under `openMF/web-app` for convenience. To publish as its own GitHub repository:

```bash
# From a clean directory
git clone --no-local /path/to/web-app mifos-web-next-standalone
cd mifos-web-next-standalone
git filter-repo --subdirectory-filter mifos-web-next  # requires git-filter-repo
# Or copy mifos-web-next/ only into a new repo root
```

Then set the remote to the new `openMF/mifos-web-next` (or your org) repository.
