## Hostinger (production) deployment — sgrdmasale.com

Live at https://sgrdmasale.com, hosted on Hostinger's "Web Apps" platform
(hPanel → Websites → sgrdmasale.com → Redeploy), **not** a plain VPS — there's
no shell access to node/npm/docker, just a build UI: pick a framework preset,
upload source (as a zip, or "use previous files" to redeploy unchanged), set
env vars, deploy. One long-running Node process per app; MongoDB is Atlas
(no local mongod — the host's CPU/plan doesn't offer one), shown under the
site's "Essentials" card in hPanel.

Original outage cause: the site was configured with the `React` framework
preset (static build only), so the SPA loaded but the API never ran — every
`/hcgi/api/*` call fell through Apache's SPA rewrite and got `index.html`
back instead of JSON.

**Working configuration:**

| Field | Value |
|---|---|
| Framework preset | `Express` |
| Root directory | `./` |
| Entry file | `api/src/main.js` |
| Package manager | `npm` |
| Node version | 22.x |

Installing at repo root runs this repo's root `postinstall` script, which
runs `npm install --prefix api` only — the web/Vite toolchain is deliberately
**not** installed on the server, because this platform's `Express` preset has
no separate build step. `web/dist` must already be built and included in the
uploaded source.

`api/src/main.js` serves `web/dist` itself when the directory is present, so
one Node process is the whole site (API + static frontend) — no nginx or
separate static host, unlike the VPS setup above. On the VPS, nginx serves
`web/dist` directly and that code path is never reached.

### Env vars (set in hPanel, not in this repo)

Same keys as `api/.env.production.example`, plus `NODE_ENV=production`. One
gotcha hit in practice: re-pasting `MONGODB_URI` via hPanel's "Import .env"
can leave the key name duplicated *inside* the value
(`MONGODB_URI=mongodb+srv://...` as the literal value, instead of just
`mongodb+srv://...`) — mongoose rejects that outright. After importing,
always check the value starts with `mongodb+srv://`.

### Shipping a new deploy package

```bash
npm run build --prefix web   # produces web/dist — the only build step this platform runs for you is skipped
```

Zip up `api/` (minus `node_modules/`, `.env`, and any dev files under
`api/uploads/`), `web/dist/`, `package.json`, and `package-lock.json` — then
in hPanel: Websites → sgrdmasale.com → Redeploy → Source files → Upload new
files. Framework preset, entry file, and env vars stay as configured above
unless something changed.
