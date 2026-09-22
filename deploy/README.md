# Deploying hrmsystem

hrmsystem runs on the `104.248.154.28` droplet (`hrsystem.opssolution.tech`),
alongside the stockmanagement and surveyapp/idiapp services, following the
same pattern: a dedicated system user, a systemd service, and an nginx vhost
with a Let's Encrypt certificate.

- App user: `hrmapp` (no login shell)
- App dir: `/opt/hrmsystem/app`
- Settings: `/etc/hrmsystem.env` (root:hrmapp, 0640 — not in git)
- Service: `hrmsystem.service`, listening on port 3002
- nginx site: `/etc/nginx/sites-available/hrmsystem`

## Redeploying after a change

Push to `main` — GitHub Actions ("Deploy to Production") SSHes into the
droplet with a key that is restricted (via a forced command in
`/root/.ssh/authorized_keys`) to running only this script:

```
/opt/hrmsystem/app/deploy/deploy.sh
```

It pulls the latest code, reinstalls dependencies, rebuilds, refreshes
`/opt/hrmsystem/app/.env` from `/etc/hrmsystem.env`, and restarts the
service.

To run it by hand instead:

```
ssh root@104.248.154.28 /opt/hrmsystem/app/deploy/deploy.sh
```

## Changing a secret setting

Edit `/etc/hrmsystem.env` on the server (root only), then:

```
systemctl restart hrmsystem
```

## First-time setup on a new server

1. Create the `hrmapp` system user and `/opt/hrmsystem` directory.
2. Generate an ed25519 key for `hrmapp`, add its `.pub` as a **read-only**
   GitHub deploy key on this repo, then `git clone` into `/opt/hrmsystem/app`.
3. Write `/etc/hrmsystem.env` with the Supabase, Google Maps, R2/S3 and
   Firebase settings the app needs (see `import.meta.env.VITE_*` and
   `process.env.*` usages in `src/`, `serve.mjs`, `zkteco-adms-handler.mjs`).
4. Install `deploy/hrmsystem.service` to `/etc/systemd/system/`, then
   `systemctl daemon-reload && systemctl enable --now hrmsystem`.
5. Install `deploy/nginx-site.conf` (with `__DOMAIN__` replaced) to
   `/etc/nginx/sites-available/hrmsystem`, symlink into `sites-enabled`,
   `nginx -t && systemctl reload nginx`.
6. `certbot --nginx -d <domain> --non-interactive --agree-tos --redirect`.
7. Generate a separate ed25519 keypair for CI, restrict it in
   `/root/.ssh/authorized_keys` with
   `command="/opt/hrmsystem/app/deploy/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty`,
   and set the repo's `DEPLOY_HOST`, `DEPLOY_USER=root` and `DEPLOY_SSH_KEY`
   (base64 of the private key) secrets.
