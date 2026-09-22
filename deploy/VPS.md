# SGRD Masale — VPS deployment (nginx + Express + MongoDB)

This is the self-hosted setup running `https://sgrdmasale.com` on the VPS.
(`deploy/README.md` covers the separate Hostinger "Web Apps" deployment.)

```
browser ──► nginx :443  (sgrdmasale.com)
             ├── /              → static files in web/dist   (SPA fallback → index.html)
             └── /hcgi/api/*    → http://127.0.0.1:3001      (Express, run by pm2)
                                        └── mongodb://127.0.0.1:27017/sgrd_masale
                                            (docker container, MongoDB 4.4)
```

The frontend only ever calls the relative path `/hcgi/api/...`, so it has no
build-time API URL. It works on any domain as long as nginx forwards that prefix.

---

## Where everything is

| Thing | Value |
|---|---|
| Server | `ssh -p 2244 root@103.14.120.165` (Ubuntu 24.04, shared with other client apps) |
| App directory | `/var/www/sgrdmasale` (shallow clone of `main`) |
| API process | pm2 app `sgrd-api`, `127.0.0.1:3001` |
| API config | `/var/www/sgrdmasale/api/.env` (mode 600, **not in git**) |
| Frontend build | `/var/www/sgrdmasale/web/dist` (generated, git-ignored) |
| Database | docker container `sgrd-mongo`, image `mongo:4.4`, volume `sgrd-mongo-data`, bound to `127.0.0.1:27017` only |
| Uploaded images | `/var/www/sgrdmasale/api/uploads/` (served at `/hcgi/api/uploads/<name>`) |
| nginx site | `/etc/nginx/sites-available/sgrdmasale` (symlinked into `sites-enabled`) |
| TLS | Let's Encrypt via `certbot --nginx`, auto-renews |
| Logs | `pm2 logs sgrd-api` · `/var/log/nginx/sgrdmasale.{access,error}.log` · `docker logs sgrd-mongo` |

`www.sgrdmasale.com` is **not** on this server yet (still a CNAME to Hostinger).

---

## Constraints of this server (why things are done the way they are)

- **No AVX on the CPU** → MongoDB 5.0+ crashes on start. 4.4 is the newest that runs, hence `mongo:4.4`.
  Restoring a dump taken from a newer MongoDB works for this app's simple data, but watch for index errors.
- **No C compiler** → `better-sqlite3` (only used by an old one-off migration script) can't build.
  Always install API deps with `--ignore-scripts`.
- **Memory is tight** (other apps share the box). The Mongo container is capped (`--memory=600m`,
  WiredTiger cache 0.25 GB). The Vite build fits (~1 GB peak) but don't run it alongside other heavy jobs.
- **Outbound port 27017 is blocked by the VPS provider.** The server cannot connect to MongoDB Atlas
  or any other remote MongoDB. Ports 443/8080/3306/5432 are fine. To pull data from a remote MongoDB,
  dump it from a machine that can reach it and `scp` the dump over (see "Restore data").
- **The API must be started with `--env-file=.env`.** `mongo-auth.js` reads `JWT_SECRET` at import time,
  before `main.js` calls `dotenv.config()`. pm2 is configured with `--node-args="--env-file=.env"`.

---

## Routine redeploy (after new commits on `main`)

```bash
ssh -p 2244 root@103.14.120.165
cd /var/www/sgrdmasale
git pull

# API dependencies (only needed if api/package*.json changed)
cd api && npm ci --omit=dev --ignore-scripts && cd ..

# Frontend (rebuild whenever anything under web/ changed)
cd web && npm ci && NODE_OPTIONS=--max-old-space-size=1024 npm run build && cd ..

# Apply
pm2 restart sgrd-api --update-env
```

- Frontend changes take effect as soon as the build finishes (nginx serves the files directly).
- Only API changes need the `pm2 restart`.
- nginx only needs `nginx -t && systemctl reload nginx` if its config changed.
- If `git pull` complains about local changes, look at `git status` first. Nothing tracked should
  be edited on the server; `api/.env` and `web/dist` are untracked/ignored and are safe.

### Verify after every deploy

```bash
curl -s https://sgrdmasale.com/hcgi/api/health          # {"status":"ok"}
curl -s https://sgrdmasale.com/hcgi/api/db/collections/products?perPage=1   # {"totalItems":N,...}
curl -sI https://sgrdmasale.com/ | head -1               # HTTP/2 200
pm2 list                                                 # sgrd-api online, restarts not climbing
pm2 logs sgrd-api --lines 30 --nostream                  # no errors
```

### Roll back

```bash
cd /var/www/sgrdmasale
git log --oneline -5                 # find the last good commit
git checkout <good-commit>           # detached HEAD is fine for a rollback
# then repeat the install/build/restart steps above
# to go forward again: git checkout main && git pull
```

---

## Changing configuration (`api/.env`)

Edit the file, then `pm2 restart sgrd-api --update-env`. Current keys:

```
NODE_ENV=production
PORT=3001
API_HOST=127.0.0.1
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=sgrd_masale
JWT_SECRET=<long random value, generated at install>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://sgrdmasale.com
DEFAULT_SHIPPING_COST=50
RAZORPAY_MODE=live
RAZORPAY_KEY_ID=<client's live key>
RAZORPAY_KEY_SECRET=<client's live key>
```

**Set on the VPS:**

| Feature | Variables |
|---|---|
| Razorpay payments | ✅ `RAZORPAY_MODE=live`, `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (live keys from Hostinger, tested Sep 20) |

**Not set on the VPS yet** (features return a clean 4xx/503 until they are):

| Feature | Variables |
|---|---|
| Google reviews | `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` (Hostinger has keys, but Google API blocks server requests — browser-only API; needs rework) |
| Delhivery shipping rates | `DELHIVERY_API_KEY` (not set on Hostinger either) |

The values for these currently live in the Hostinger hPanel environment variables.
Never commit them; put them only in the server's `api/.env`.
Changing `JWT_SECRET` logs everyone out.

---

## Database

### Back up (do this regularly — nothing automated is set up yet)

```bash
docker exec sgrd-mongo mongodump --db sgrd_masale --archive --gzip > /root/backups/sgrd-$(date +%F).archive.gz
```

Suggested daily cron (`crontab -e` as root), keeping 14 days:

```
0 3 * * * mkdir -p /root/backups && docker exec sgrd-mongo mongodump --db sgrd_masale --archive --gzip > /root/backups/sgrd-$(date +\%F).archive.gz && find /root/backups -name 'sgrd-*.archive.gz' -mtime +14 -delete
```

Copy backups **off the server** occasionally. A backup on the same disk doesn't survive a disk failure.
Backups contain password hashes and customer data — keep them private.

### Restore data (from a dump file)

```bash
# 1. get the dump onto the server (e.g. from your laptop)
scp -P 2244 -r ./sgrd-dump root@103.14.120.165:/tmp/sgrd-dump

# 2. restore into the local container (add --drop to replace existing collections)
ssh -p 2244 root@103.14.120.165
mongorestore --uri="mongodb://127.0.0.1:27017" --db=sgrd_masale /tmp/sgrd-dump/sgrd_masale

# 3. delete the dump from the server afterwards
rm -rf /tmp/sgrd-dump
```

To restore from an `--archive` file made by the backup command above:

```bash
docker exec -i sgrd-mongo mongorestore --archive --gzip --drop < /root/backups/sgrd-YYYY-MM-DD.archive.gz
```

### Look inside the database

```bash
docker exec -it sgrd-mongo mongo sgrd_masale
> db.products.countDocuments({})
> db.admin.find({}, {email:1, name:1})
```

### Create an admin login

The repo has no seed script, and the API can't create the first admin (only an existing admin can).
Either restore a dump that already contains admins, or insert one with a bcrypt hash:

```bash
cd /var/www/sgrdmasale/api
HASH=$(node -e "import('bcryptjs').then(b=>b.default.hash(process.argv[1],12).then(console.log))" 'NEW_STRONG_PASSWORD')
docker exec sgrd-mongo mongo sgrd_masale --eval "db.admin.insertOne({id:'$(openssl rand -hex 8)',collectionName:'admin',email:'you@example.com',passwordHash:'$HASH',name:'Admin',role:'admin',created:new Date().toISOString(),updated:new Date().toISOString()})"
```

---

## Uploaded images

Product/banner/category records store only a **filename**; the file itself must exist in
`api/uploads/`. Files uploaded through the admin panel land in that folder on the server.
Some images are also tracked in git, but most are not, so **back up `api/uploads/` too**:

```bash
tar czf /root/backups/uploads-$(date +%F).tgz -C /var/www/sgrdmasale/api uploads
```

To check for records pointing at missing files, compare the filenames in the database
against `ls api/uploads` (a broken image on the site means the file is missing there).

---

## nginx site

`/etc/nginx/sites-available/sgrdmasale` (certbot adds the `443` block and the HTTP→HTTPS redirect):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name sgrdmasale.com;

    root /var/www/sgrdmasale/web/dist;
    index index.html;

    access_log /var/log/nginx/sgrdmasale.access.log;
    error_log  /var/log/nginx/sgrdmasale.error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml;

    client_max_body_size 25m;

    location /hcgi/api/ {
        proxy_pass http://127.0.0.1:3001;          # no path → URI is forwarded unchanged
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=604800, immutable" always;
        access_log off;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;          # SPA history fallback
    }

    location ~ /\.(?!well-known) { deny all; access_log off; log_not_found off; }
}
```

`/var/www/sgrdmasale`, `web` and `web/dist` must be world-readable/traversable (`chmod o+rx`) so the
nginx worker can serve them.

### Adding `www.sgrdmasale.com`

1. In DNS, replace the `www` CNAME (currently → Hostinger) with an `A` record to `103.14.120.165`.
2. Add `www.sgrdmasale.com` to `server_name`, then:
   `certbot --nginx -d sgrdmasale.com -d www.sgrdmasale.com --expand`
3. Optionally add a redirect server block from `www` to the apex.

### Certificates

`certbot renew --dry-run` checks that auto-renewal works. Certbot rewrites the nginx file in place;
don't hand-edit the lines marked `# managed by Certbot`.

---

## Rebuild the whole thing on a fresh Ubuntu server

Prerequisites: Node 20+, nginx, git, docker, certbot, pm2 (`npm i -g pm2`), and the domain's `A` record
already pointing at the server.

```bash
# 1. MongoDB (on a CPU with AVX use mongo:7 and drop the cache flag)
docker run -d --name sgrd-mongo --restart unless-stopped \
  -p 127.0.0.1:27017:27017 --memory=600m --memory-swap=900m \
  -v sgrd-mongo-data:/data/db mongo:4.4 --wiredTigerCacheSizeGB 0.25

# 2. Code + dependencies + frontend build
git clone https://github.com/sgrdmasale/sgrdmasale.git /var/www/sgrdmasale
cd /var/www/sgrdmasale
(cd api && npm ci --omit=dev --ignore-scripts)
(cd web && npm ci && NODE_OPTIONS=--max-old-space-size=1024 npm run build)
chmod o+rx /var/www/sgrdmasale /var/www/sgrdmasale/web /var/www/sgrdmasale/web/dist

# 3. API config
cat > api/.env <<EOF
NODE_ENV=production
PORT=3001
API_HOST=127.0.0.1
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=sgrd_masale
JWT_SECRET=$(openssl rand -hex 48)
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://YOUR-DOMAIN
DEFAULT_SHIPPING_COST=50
EOF
chmod 600 api/.env

# 4. Run the API (needs --env-file, see "Constraints")
cd api
pm2 start src/main.js --name sgrd-api --cwd "$PWD" --node-args="--env-file=.env" --time
pm2 save          # pm2's boot service (pm2-root) restores it after a reboot

# 5. nginx + TLS: create the site file above, then
ln -sf /etc/nginx/sites-available/sgrdmasale /etc/nginx/sites-enabled/sgrdmasale
nginx -t && systemctl reload nginx
certbot --nginx -d YOUR-DOMAIN --non-interactive --agree-tos --redirect

# 6. Restore data + uploads (see the sections above), then run the verify commands
```

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Site loads but no products / everything blank | `curl https://<domain>/hcgi/api/health`. If that returns HTML, nginx isn't proxying `/hcgi/api/`; if it 502s, the API is down (`pm2 logs sgrd-api`). |
| API keeps restarting | `pm2 logs sgrd-api --err`. Usual causes: `JWT_SECRET` missing from `.env`, or the `mongo` container isn't running (`docker ps`). |
| API crashes with "JWT_SECRET is required" | Started without `--env-file=.env`. Delete and re-add the pm2 process with `--node-args`. |
| `npm ci` fails building `better-sqlite3` | Add `--ignore-scripts` (no compiler on the box). |
| Mongo container restart-loops with an AVX warning | CPU has no AVX. Use `mongo:4.4`, not 5+. |
| Product images broken | The file named in the record is missing from `api/uploads/`. |
| `mongodump`/`mongorestore` to a remote MongoDB times out | Provider blocks outbound 27017. Dump elsewhere and `scp` it over. |
| Vite build killed / out of memory | Free memory first (`free -m`), or build on another machine and copy `web/dist` up. |

---

## Tear it all down

```bash
pm2 delete sgrd-api && pm2 save
docker rm -f sgrd-mongo && docker volume rm sgrd-mongo-data      # DESTROYS the database — back up first
rm /etc/nginx/sites-enabled/sgrdmasale /etc/nginx/sites-available/sgrdmasale
nginx -t && systemctl reload nginx
certbot delete --cert-name sgrdmasale.com
rm -rf /var/www/sgrdmasale
```
