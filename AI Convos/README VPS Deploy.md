# VPS deployment

The workflow builds this Node.js/TypeScript API on pushes to `etu` and on manual
runs. Change `branches: [etu]` in `.github/workflows/deploy.yml` if needed (the
current development branch is `feat/1-add-register-login`).

## One-time server setup

1. Install Node.js 24 and npm system-wide on the Ubuntu VPS. Verify that
   `/usr/bin/node --version` reports v24 and that the SSH user can run `node`,
   `npm`, `curl`, and `tar` in a noninteractive SSH session. Install `sudo` too;
   deployment uses `sudo -n`, so the SSH user needs passwordless privileges for
   the deployment commands (or can be root with sudo installed).
   Install the Node runtime's atomic library on Ubuntu/Debian:

   ```sh
   sudo apt-get update
   sudo apt-get install -y libatomic1
   ```

   Keep Node installed system-wide; do not add the `node` npm package to the
   application's dependencies, since it can override the system runtime during
   dependency installation. A `libatomic.so.1` error during `npm ci` indicates
   that the Node binary being used needs this system library.
2. Create the MariaDB database and application user, and apply the schema before
   deploying. Schema changes are deliberately a separate operation; this workflow
   does not run `db:push` or migrations against production.
3. Configure the GitHub secrets listed below. The workflow generates
   `/etc/bank.env` on every deployment with root ownership and mode 600.
   Systemd reads it before starting the API as `www-data`. It sets
   `NODE_ENV=production` and `PORT=3001` to match the startup probe and reverse proxy.
   You do not need to create this file manually.
4. Copy `deploy/bank.service` to `/etc/systemd/system/bank.service`.
   If the previous API runs as `cleantodo`, stop and disable that service before
   the first deployment so it does not occupy port 3001. Run:

   ```sh
   sudo systemctl daemon-reload
   sudo systemctl enable bank
   ```

   The first deployment creates `/var/www/bank/current` and starts the service.
   The previous deployment directory is left in place. The first deployment
   cannot roll back to the previous .NET application automatically.
5. Configure Nginx for `bank.jhinsama.com` using the instructions below.
   Restrict direct public access to port 3001 with the VPS firewall. HTTPS is
   required for the production login cookie.

## Nginx and bank.jhinsama.com (one-time setup)

The deployment creates `/var/www/bank/releases/<release-id>`, including missing
parent directories, and the `/var/www/bank/current` symlink. It also creates
`/etc/bank.env`. You do not need to create these yourself. It does not install
Node.js, the systemd unit, Nginx, DNS records, or a TLS certificate.
The `bank.service` check happens before directory creation, so complete the
one-time service setup first.

In the DNS settings for `jhinsama.com`, point an `A` record named `bank` at the
VPS's public IPv4 address. If an `AAAA` record exists, it must also point to this
VPS's working IPv6 address. Allow incoming TCP ports 80 and 443 in the VPS and
provider firewalls.

On Ubuntu/Debian with the standard Nginx `sites-available` layout, copy
`deploy/bank.nginx.conf` to the VPS, then install it as
`/etc/nginx/sites-available/bank.jhinsama.com`. If you have a repository checkout
on the VPS, run these commands from that checkout:

```sh
sudo install -m 644 deploy/bank.service /etc/systemd/system/bank.service
sudo systemctl daemon-reload
sudo systemctl enable bank
sudo install -m 644 deploy/bank.nginx.conf /etc/nginx/sites-available/bank.jhinsama.com
sudo ln -s /etc/nginx/sites-available/bank.jhinsama.com /etc/nginx/sites-enabled/bank.jhinsama.com
sudo nginx -t
sudo systemctl reload nginx
```

If an Nginx site already uses `server_name bank.jhinsama.com`, update that site
instead of enabling a second one. The symlink command is only needed once.
The supplied configuration forwards all paths unchanged to `127.0.0.1:3001`.
Before the first successful API deployment, Nginx can return 502.

After DNS points to this VPS, install Certbot with its Nginx plugin according to
the [official instructions](https://certbot.eff.org/instructions?ws=nginx), then run:

```sh
sudo certbot --nginx -d bank.jhinsama.com --redirect
sudo certbot renew --dry-run
```

Certbot adds the HTTPS configuration and redirect to the enabled Nginx site.
Do not overwrite that site with the initial HTTP template after obtaining TLS.
After deployment, verify:

```sh
curl --fail https://bank.jhinsama.com/ping
curl --fail https://bank.jhinsama.com/health
```

`HOST` remains the VPS's SSH hostname or public IP. The API's public subdomain is
configured in DNS and Nginx; it does not need to replace that GitHub secret.
Reference: [Nginx proxy directives](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).

## GitHub configuration

Add these repository Actions secrets:

| Secret | Value |
| --- | --- |
| `HOST` | VPS hostname or IP |
| `USERNAME` | SSH deployment user |
| `SSH_KEY` | Private SSH key |
| `SSH_PASSPHRASE` | Key passphrase, if the key has one |
| `DB_CONNECTION_STRING` | MySQL URL: `mysql://bank_api:password@127.0.0.1:3306/ScammistanBank` |
| `JWT_KEY` | Secret used to sign and verify JWTs |

The API and Drizzle CLI use `DB_CONNECTION_STRING`; authentication uses `JWT_KEY`.
Use a MySQL URL, not a .NET-style `Server=...;Database=...` string. Percent-encode
special characters in the URL's username and password (for example, `@` as `%40`).
Secrets must be nonempty single-line values. Local development uses the same
variable names in `.env`; see `.env.example`.

## Deployment behavior

The workflow uploads only `dist`, the npm manifests, and `swagger.yml` into a new
release directory, plus a temporary environment file generated from GitHub secrets.
It installs production dependencies on Linux before changing
the `current` symlink and restarting `bank`. It preserves previous releases
and rolls back both the symlink and `/etc/bank.env` if restart or the `/ping`
startup probe fails. The temporary environment file is deleted after installation;
the previous environment backup is deleted after success. Remove
unused release directories periodically, preserving the current and rollback
releases. Concurrent deployments are serialized.

`npm run build` writes `dist/package.json` with `type: commonjs` because TypeScript
currently emits CommonJS while the source package uses ES modules. The VPS runs
the compiled code with the system Node.js 24 binary.

The startup probe checks the API process only. Check `/health` separately to
verify MariaDB and the `users` table in the database selected by the URL.
Swagger is disabled in
production by the current server code.

Useful commands on the VPS:

```sh
sudo systemctl status bank --no-pager
sudo journalctl -u bank -n 100 --no-pager
curl --fail http://127.0.0.1:3001/ping
curl --fail http://127.0.0.1:3001/health
```

Action references: [setup-node](https://github.com/actions/setup-node),
[ssh-action](https://github.com/appleboy/ssh-action), and
[scp-action](https://github.com/appleboy/scp-action).
