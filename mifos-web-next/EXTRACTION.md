# Standalone private repository

This folder may live inside another git tree temporarily. For a **private** remote of your own:

```bash
# Option A: new repo with only this tree
mkdir ../my-fineract-ui && cp -R mifos-web-next/. ../my-fineract-ui/
cd ../my-fineract-ui
git init
git remote add origin git@github.com:<you>/<private-repo>.git

# Option B: filter from a parent clone (if nested in web-app)
git filter-repo --subdirectory-filter mifos-web-next
```

Point `origin` at your private host (GitHub private, GitLab, self-hosted). No requirement to publish to openMF or announce to the Mifos community.
