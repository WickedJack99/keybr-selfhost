import { type IncomingHeaders } from "@fastr/headers";
import { FavIconAssets, ScriptAssets, StylesheetAssets } from "@keybr/assets";
import { getDir } from "@keybr/intl";
import {
  LoadingProgress,
  PageDataScript,
  type PageInfo,
  Pages,
  Root,
  usePageData,
} from "@keybr/pages-shared";
import { ThemePrefs, useTheme } from "@keybr/themes";
import { type ReactNode } from "react";
import { useIntl } from "react-intl";
import { isBot } from "./bot.ts";
import { favIcons, Metas } from "./meta.tsx";

export function Shell({
  page,
  headers,
}: {
  readonly page: PageInfo;
  readonly headers: IncomingHeaders;
}) {
  const { user } = usePageData();
  return (
    <Html>
      <Head page={page} />
      <Body>
        {isBot(headers) ? (
          user == null ? (
            <LoginContent />
          ) : (
            <Content page={page} />
          )
        ) : (
          <LoadingProgress />
        )}
      </Body>
    </Html>
  );
}

function Html({ children }: { readonly children?: ReactNode }) {
  const { locale } = usePageData();
  const theme = useTheme();
  return (
    <html
      lang={locale}
      dir={getDir(locale)}
      prefix="og: http://ogp.me/ns#"
      {...ThemePrefs.dataAttributes(theme)}
    >
      {children}
    </html>
  );
}

function Head({
  page,
  children,
}: {
  readonly page: PageInfo;
  readonly children?: ReactNode;
}) {
  const { formatMessage } = useIntl();
  return (
    <head>
      <meta charSet="UTF-8" />
      <title>{formatMessage(page.title)}</title>
      <StylesheetAssets entrypoint="browser" />
      <FavIconAssets links={favIcons} />
      <Metas page={page} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <PageDataScript />
      <ScriptAssets entrypoint="browser" />
      {children}
    </head>
  );
}

function Body({ children }: { readonly children?: ReactNode }) {
  return (
    <body>
      <Root>{children}</Root>
    </body>
  );
}

function Content({ page }: { readonly page: PageInfo }) {
  const { formatMessage, locale } = useIntl();
  return (
    <>
      <h1>{formatMessage(page.link.label)}</h1>
      {page.link.title && <p>{formatMessage(page.link.title)}</p>}
      <nav>
        <ul>
          {[
            Pages.practice,
            Pages.profile,
            Pages.typingTest,
            Pages.layouts,
            Pages.help,
          ].map(({ path, link }, index) => (
            <li key={index}>
              <a
                href={Pages.intlPath(path, locale)}
                title={link.title && formatMessage(link.title)}
              >
                {formatMessage(link.label)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

function LoginContent() {
  const { sourceCodeUrl } = usePageData();
  return (
    <>
      <h1>Typing</h1>
      <p>Private typing practice powered by Keybr.</p>
      <p>
        Based on Keybr · AGPL-3.0 ·{" "}
        {sourceCodeUrl != null && <a href={sourceCodeUrl}>Source Code</a>}
      </p>
    </>
  );
}
