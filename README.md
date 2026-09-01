[![CI](https://github.com/aradzie/keybr.com/actions/workflows/ci.yml/badge.svg)](https://github.com/aradzie/keybr.com/actions/workflows/ci.yml)

# [keybr.com](https://www.keybr.com/) is not (just) a typing test

<p align="center">
    <img src="assets/screenshot.png" alt="screenshot" width="600"/>
</p>

It's the smartest way to learn touch typing and improve your typing speed.
On the surface, it looks pretty simple: it shows you a piece of text, and you type it out.
But the devil is in the details — keybr.com offers a few unique features:

* keybr.com tracks every single keystroke and computes statistics for each individual key.
* It automatically generates lessons that focus on your weakest keys.
* You can set your own target typing speed, and it tracks your progress toward that goal.
* It starts with a small set of the most frequent letters in your language.
* More letters are added once you reach the target speed with the current ones.
* It can even predict how many more lessons you will need to complete to reach your target speed.
* It provides a beautiful profile page with detailed graphs showing your learning progress.
* It offers plenty of modes and configuration options.

<p align="center">
    <img src="docs/assets/graph.png" alt="screenshot" width="600"/>
</p>

## Custom self-hosted build

This repository is a custom self-hosting variant of [upstream Keybr](https://github.com/aradzie/keybr.com). It is intended primarily for one private user running the application on their own server, for example with Docker or Coolify. It is not the public keybr.com service.

The typing-learning functionality remains intentionally close to upstream Keybr. The lesson engine, adaptive learning algorithms, typing statistics, keyboard layouts, settings, generated lesson content, and learner-facing UI are preserved as much as possible.

### What this build adds

* A private single-user installation mode that requires authentication before accessing the application.
* Local username/password authentication, with passwords stored as hashes.
* A `user:create` CLI command for creating the first local user or changing that user's password.
* Persistent application state under `/data`, including the SQLite database, file-backed sessions, settings, and typing data.
* A self-contained Docker image that does not require Git metadata during the Docker build.
* A Docker healthcheck at `/healthz` and configuration examples for self-hosting.
* Coolify deployment documentation, including the required port, persistent volume, environment variables, and first-user setup.

### What differs from upstream

For a basic private installation, SMTP and OAuth are not required. The local account replaces upstream e-mail, magic-link, and OAuth login flows. The private mode also disables public-facing features that do not fit a single-user instance, including public registration, public profiles, high scores, multiplayer, checkout, and the sitemap. These routes remain in the source where practical, but are blocked by private mode rather than being part of the self-hosted user flow.

Anonymous browser progress is not used as the primary account: unauthenticated requests are sent to `/login`, and the authenticated local user's progress is stored in the persistent `/data` volume. Keeping that volume attached across redeployments preserves the account, session files, settings, and typing history.

For the complete Docker and Coolify instructions, see [docs/self_hosting.md](./docs/self_hosting.md). Start with [.env.example.selfhost](./.env.example.selfhost); it contains the small set of values normally needed for this build.

## Can I contribute?

Yes!

* **[Give us a ⭐️.](https://github.com/aradzie/keybr.com)** Help this project gain visibility and stand out.
* **[Report a bug.](https://github.com/aradzie/keybr.com/issues)** If something is not working, let us know.
* **[Suggest a feature.](https://github.com/aradzie/keybr.com/issues)** We are open to new ideas.
* **[Translate.](./docs/translations.md)** If you want to see keybr.com in your language.
* **[Getting started.](./docs/getting_started.md)** Launch a local instance of keybr.com, make a pull request.
* **[Self-hosting.](./docs/self_hosting.md)** Deploy a personal Docker/Coolify instance with a local account.
* **[Add a keyboard.](docs/custom_keyboard.md)** Add a custom keyboard to keybr.com
* **[Add a language.](docs/custom_language.md)** Add a custom language to keybr.com
* **[Join our Discord server](https://discord.gg/gY4RA4enVH).** To discuss things in a less formal way.

## License

This custom build remains released under the GNU Affero General Public License v3.0. Keep the repository's `LICENSE` file and Keybr attribution when building or redistributing it. If you run modified source as a network service, AGPL-3.0 requires users to be able to obtain the corresponding source code.
