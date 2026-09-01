# Self-hosting Keybr

This checkout includes a small self-hosted deployment mode for a personal Keybr instance. It keeps the existing lesson engine, typing statistics, keyboard layouts, settings, and learning algorithms. A local password account replaces the public service's dependency on e-mail or OAuth for the basic installation.

## Docker Compose

Copy `.env.example.selfhost` to `.env`, set the public URL and the URL of the corresponding source, then run:

```shell
docker compose up -d --build
```

The application listens on port `3000`. The named `keybr-data` volume is mounted at `/data` and contains the SQLite database, sessions, settings, and typing data. Do not remove this volume when recreating the container.

Create the only local user after the image has been built:

```shell
docker compose run --rm keybr npm run user:create -- --username jack
```

The command securely prompts for the password when attached to a terminal. For non-interactive use, pipe a password through standard input:

```shell
printf '%s\n' 'use-a-long-password' | docker compose run --rm -T keybr npm run user:create -- --username jack --password-stdin
```

## Coolify

Create an application from this repository and select the Dockerfile build pack:

1. Set the branch and Dockerfile location to the checkout you want to deploy and `/Dockerfile`.
2. Set the application port to `3000`. Coolify supplies the public reverse proxy and HTTPS; no extra Nginx container is required.
3. Add a persistent volume with container path `/data`. The source can be a Coolify-managed volume such as `keybr-data`.
4. Add these runtime environment variables:

   ```text
   APP_URL=https://keybr.example.com/
   SOURCE_CODE_URL=https://github.com/your-user/your-keybr-fork
   ```

   `PRIVATE_MODE=true`, `DATA_DIR=/data`, `DATABASE_CLIENT=sqlite`, `DATABASE_FILENAME=/data/database.sqlite`, and the server ports are already image defaults. `COOKIE_SECURE` also defaults to the secure setting needed behind Coolify HTTPS. If testing over plain HTTP, set `COOKIE_SECURE=false` temporarily.

5. Deploy the application. It creates the SQLite schema on startup. Open the Coolify terminal and run `npm run user:create -- --username jack`; enter the password twice, then visit the configured `APP_URL` and sign in.

The container healthcheck requests `http://127.0.0.1:3000/healthz`. A healthy response confirms that the HTTP server and database are available. Keep the `/data` volume when redeploying so the account, session, and typing history survive image updates. Run the same `user:create` command with the existing username to change its password; it updates the existing local account rather than creating a duplicate.

The upstream multiplayer worker remains in the source tree for maintainability, but private mode blocks its routes and it is not required for the personal application. Only expose port `3000`.

## Private access and persistence

Unauthenticated browser requests redirect to `/login`; unauthenticated API requests return `401`. High scores, multiplayer, public profiles, checkout, public registration, magic-link login, OAuth, and sitemap routes are unavailable in private mode. The login session is stored in `/data/sessions`, while SQLite is `/data/database.sqlite`; user settings, typing results, and other mutable files also use `/data`.

Logout is available in the sidebar and destroys the server session. The local username is stored through the existing user model, with an internal `.local.invalid` e-mail placeholder for compatibility; it is never used as an e-mail login.

To update from upstream, preserve the `/data` volume, review upstream changes against this fork's isolated self-hosting files, rebuild the image, and redeploy. Back up `/data` before upgrades.

## License and attribution

Keybr remains available under the GNU Affero General Public License, version 3.0. Keep the repository's `LICENSE` file and upstream attribution when building or redistributing this variant. If you make the modified source available as a network service, AGPL-3.0 requires users to be able to obtain the corresponding source code for the running version.
