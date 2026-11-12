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
2. Create the MariaDB database and application user, and apply the schema before
   deploying. Schema changes are deliberately a separate operation; this workflow
   does not run `db:push` or migrations against production.
3. Copy `deploy/bank.env.example` to `/etc/bank.env` on the VPS and edit
   the values there. Use `sudo chown root:root /etc/bank.env` and
   `sudo chmod 600 /etc/bank.env`. Systemd reads the file before starting the
   API as `www-data`. Keep `PORT=3001` to match the workflow's startup probe and
   your reverse proxy. No database or JWT secrets are uploaded by the workflow.
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
5. Configure your HTTPS reverse proxy/FQDN to forward to `http://127.0.0.1:3001`.
   Restrict direct public access to port 3001 with the VPS firewall. HTTPS is
   required for the production login cookie.

## GitHub configuration

Add these repository Actions secrets:

| Secret | Value |
| --- | --- |
| `HOST` | VPS hostname or IP |
| `USERNAME` | SSH deployment user |
| `SSH_KEY` | Private SSH key |
| `SSH_PASSPHRASE` | Key passphrase, if the key has one |

The old `DB_CONNECTION_STRING` and `JWT_KEY` secrets are not used. Node reads the
individual `DB_*` variables and `JWT_SECRET` from the server's environment file.

## Deployment behavior

The workflow uploads only `dist`, the npm manifests, and `swagger.yml` into a new
release directory. It installs production dependencies on Linux before changing
the `current` symlink and restarting `bank`. It preserves previous releases
and rolls back the symlink if restart or the `/ping` startup probe fails. Remove
unused release directories periodically, preserving the current and rollback
releases. Concurrent deployments are serialized.

`npm run build` writes `dist/package.json` with `type: commonjs` because TypeScript
currently emits CommonJS while the source package uses ES modules. The VPS runs
the compiled code with the system Node.js 24 binary.

The startup probe checks the API process only. Check `/health` separately to
verify MariaDB. Currently that endpoint also explicitly checks for a database
named `ScammistanBank` and a `users` table; using another `DB_NAME` requires
updating `testConnection` in `src/db/connection.ts`. Swagger is disabled in
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
