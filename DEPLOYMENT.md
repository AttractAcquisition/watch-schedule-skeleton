# Deployment

This app is a TanStack Start front end with an SSR server bundle. It should be deployed to an SSR-capable target rather than plain GitHub Pages.

## GitHub Actions to Cloudflare Pages

The deployment workflow is `.github/workflows/deploy.yml`.

Required GitHub repository configuration:

- Secret: `CLOUDFLARE_API_TOKEN`
- Secret: `CLOUDFLARE_ACCOUNT_ID`
- Variable: `CLOUDFLARE_PROJECT_NAME`

The workflow runs:

```bash
NITRO_PRESET=cloudflare-pages npm run build
```

Then publishes `dist` with Wrangler. For this TanStack Start/Nitro setup, the Cloudflare Pages build includes static assets plus the generated `_worker.js` bundle in `dist`.

## CI

`.github/workflows/ci.yml` runs lint and the normal production build on pull requests and pushes to `main`.
