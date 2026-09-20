# VPS deployment

The production domain is https://special-organic.com (www redirects to the apex).
The existing host Nginx terminates TLS and proxies only this domain to
127.0.0.1:8088. Compose project `special_organic` owns one non-root PHP/Apache
container with a read-only filesystem, a dedicated network, and resource limits.
Do not restart Docker, reboot the host, prune Docker globally, or run commands
against any other Compose project as part of this deployment.

## Layout and credentials

- `/home/special_organic/repository`: public GitHub checkout, pinned to a commit.
- `/home/special_organic/runtime.env`: pinned PHP base, account UID/GID, release SHA.
- `/home/special_organic/shared/{database,uploads,sessions}`: persistent data.
- `/home/special_organic/backups`: daily snapshots, seven-day retention.
- `/etc/nginx/sites-available/special-organic.conf`: dedicated virtual hosts.
- `/root/special-organic-deploy`: baseline records, protected from other users.

The `special_organic` Linux password is locked; this account has neither sudo nor
Docker access. Root performs deployment operations; the app runs with this
account's UID/GID. The dashboard phone is `01000000000`. Its randomly generated
production password is delivered privately outside Git. The repository's default
password must be replaced before routing public traffic. Never put passwords in
Docker build arguments, command arguments, Git, or logs.

No local development database is imported. A new database uses repository seed
data and starts order IDs at 999. Initialize uploads from the repository on the
first deployment only; later releases must not overwrite existing uploaded files.

## First deployment

1. Save existing site responses, Nginx config hashes, container IDs and start times.
2. Create the account, clone the repository as that user, and check out the exact
   deployment commit. Create shared directories owned by its UID/GID, mode 750;
   backups mode 700. The home directory needs traversal (711) for ACME requests.
3. Copy `runtime.env.example` outside the checkout, set the actual UID/GID and
   commit, and protect it with mode 600. Build and test as described below.
4. Initialize the database using a one-off CLI container with the persistent
   database mount. Replace the default admin password via stdin before starting
   the web container. Verify no orders exist and the sequence is 998.
5. Start only this Compose project. Confirm local health and sensitive-path denials.
6. Add an HTTP-only Nginx virtual host for this domain, serving
   `/.well-known/acme-challenge/` from `/home/special_organic/acme` and returning
   503 elsewhere until TLS is ready. Run `nginx -t` before a graceful reload.
7. Use installed Certbot `certonly --webroot` with that webroot, certificate name
   `special-organic.com`, and both `special-organic.com` and
   `www.special-organic.com`. Reuse the existing ACME account; never use standalone
   validation or the Nginx installer. Check existing hooks before issuance.
8. Install `renew-certificate.sh` root-owned under `/usr/local/libexec/` and set it
   as this certificate's deploy hook. Install `nginx.conf` as the dedicated site
   file, test Nginx, then reload gracefully. Preserve other site files exactly.
9. Set only the special-organic.com Cloudflare zone to Full (strict). Keep DNS
   records proxied. Do not enable Cache Everything for `/api/*` or admin pages.
10. Install the backup script root-owned as
    `/usr/local/libexec/special-organic-backup.py`; install the service/timer under
    `/etc/systemd/system/`. Reload systemd units and enable only
    `special-organic-backup.timer`. Run and restore-test the initial backup.

## Tests and checks

On the server, as root:

```sh
cd /home/special_organic/repository
set -a
. /home/special_organic/runtime.env
set +a
docker build --target test -f deploy/Dockerfile \
  --build-arg PHP_BASE="$PHP_BASE" --build-arg APP_UID="$APP_UID" \
  --build-arg APP_GID="$APP_GID" -t "special-organic-test:$RELEASE" .
docker run --rm --network none "special-organic-test:$RELEASE"
docker compose --env-file /home/special_organic/runtime.env -f deploy/compose.yaml config --quiet
docker compose --env-file /home/special_organic/runtime.env -f deploy/compose.yaml ps
curl -fsS http://127.0.0.1:8088/index.html >/dev/null
curl -fsS https://special-organic.com/api/get_products.php >/dev/null
nginx -t
certbot renew --cert-name special-organic.com --dry-run --run-deploy-hooks
```

Test checkout and uploads on a disposable instance with separate storage; do not
consume production order #999 for testing. Verify database/config paths return
403/404, HTTPS session cookies have Secure/HttpOnly/SameSite, default admin
credentials fail, both domains have a valid certificate, and HTTP/www redirect.
Compare saved existing-site status codes, container IDs/start times, and Nginx
checksums after deployment. The existing API root returns 404 normally.

## Updating

Run as root. Select and review the desired Git commit first. Create a backup:

```sh
systemctl start special-organic-backup.service
cd /home/special_organic/repository
runuser -u special_organic -- git fetch origin main
runuser -u special_organic -- git checkout --detach REPLACE_WITH_REVIEWED_COMMIT
```

Record the old RELEASE, set RELEASE in `/home/special_organic/runtime.env` to the
full selected commit, and run the test commands above. Build before replacing the
running container:

```sh
docker compose --env-file /home/special_organic/runtime.env -f deploy/compose.yaml build web
docker compose --env-file /home/special_organic/runtime.env -f deploy/compose.yaml up -d --no-build --wait web
```

Verify HTTP/API/admin behavior. Updates recreate only this app container and may
briefly interrupt this store. Keep the previous image and backup. Do not overwrite
shared data or regenerate the administrator password on updates. PHP base updates
require a reviewed new digest and the same tests.

## Backup, restore, and rollback

```sh
systemctl status special-organic-backup.timer
systemctl start special-organic-backup.service
journalctl -u special-organic-backup.service -n 20 --no-pager
```

Each completed backup directory contains `store.db` (SQLite online backup with
integrity check) and `uploads.tar.gz`. Sessions are intentionally not backed up.
Backups remain on this VPS and do not protect against loss of the VPS itself.

For a restore test, copy a snapshot database and extract uploads into a temporary,
private directory. Run SQLite `PRAGMA integrity_check` and compare uploads to the
archive; do not replace live files. For a real restore, put only this store into
maintenance, stop its web container, save the current data, restore the paired
snapshot/uploads, restore ownership to special_organic, and start/verify it.
Restoring a historical database can discard later orders, so reconcile those
orders before a production restore.

For an application rollback, check out the previous commit and set RELEASE back
to the saved previous image tag. Run Compose `up -d --no-build --wait web` using
that version's Compose file. This preserves data; confirm schema compatibility
before reverting across a migration. Never reset the order sequence after launch.

If the first launch fails, remove only the `special-organic.conf` enabling symlink,
run `nginx -t` and gracefully reload, then run this project's Compose `stop web`.
Preserve its shared directories and backups. Existing services stay running.
