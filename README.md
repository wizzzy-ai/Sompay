# psp_website

This repo contains:

- `frontend/`: React + Vite app
- `backend/`: backend API (not hosted by GitHub Pages)

## Hosting the React app on GitHub Pages

This repo includes a GitHub Actions workflow that builds `frontend/` and deploys it to GitHub Pages:

- `.github/workflows/deploy-pages.yml`

### One-time GitHub setup

1. Push this repo to GitHub.
2. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. (Optional) If your backend is hosted somewhere, set an Actions variable:
   - **Settings → Secrets and variables → Actions → Variables**
   - Add `VITE_API_BASE_URL` (example: `https://api.example.com`)

After that, every push to `main` deploys.

