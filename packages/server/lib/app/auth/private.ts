import { type Context, type Middleware, type Next } from "@fastr/core";
import { NotFoundError, UnauthorizedError } from "@fastr/errors";
import { type SessionState } from "@fastr/middleware-session";
import { type AuthState } from "./types.ts";

export function privateAccess(
  enabled: boolean,
): Middleware<SessionState & AuthState> {
  return async (
    ctx: Context<SessionState & AuthState>,
    next: Next,
  ): Promise<void> => {
    if (!enabled) {
      await next();
      return;
    }

    const { path, method } = ctx.request;
    if (isDisabledPath(path)) {
      throw new NotFoundError();
    }
    if (
      (path === "/login" && method === "GET") ||
      (path === "/auth/local-login" && method === "POST") ||
      path === "/auth/logout" ||
      path === "/healthz"
    ) {
      await next();
      return;
    }
    if (ctx.state.user == null) {
      if (path.startsWith("/_/") || path.startsWith("/auth/")) {
        throw new UnauthorizedError();
      }
      ctx.response.redirect("/login");
      return;
    }
    await next();
  };
}

function isDisabledPath(path: string): boolean {
  const pagePath = /^\/[a-z]{2}(?=\/)/i.test(path) ? path.substring(3) : path;
  return (
    pagePath === "/high-scores" ||
    pagePath.startsWith("/high-scores/") ||
    pagePath === "/multiplayer" ||
    pagePath.startsWith("/multiplayer/") ||
    pagePath.startsWith("/profile/") ||
    path === "/sitemap.xml" ||
    path.startsWith("/_/checkout") ||
    path.startsWith("/_/game") ||
    path.startsWith("/_/high-scores") ||
    path.startsWith("/_/profile") ||
    path.startsWith("/_/sync/data/") ||
    path.startsWith("/auth/oauth") ||
    path === "/auth/login/register-email" ||
    path.startsWith("/login/")
  );
}
