# Deployment

This app is a static Vite React SPA.

## GitHub Pages

The deployment workflow is `.github/workflows/deploy.yml`.

On pushes to `main`, it runs:

```bash
npm ci
npm run lint
npm run build
```

The build outputs static files to `dist/`, including:

- `index.html`
- `404.html` for SPA fallback
- `.nojekyll`
- `CNAME`

The workflow uploads `dist/` with `actions/upload-pages-artifact` and deploys it with `actions/deploy-pages`.
