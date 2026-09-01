import { usePageData } from "@keybr/pages-shared";
import { PortalContainer, Toaster } from "@keybr/widget";
import { type ReactNode } from "react";
import { NavMenu } from "./NavMenu.tsx";
import * as styles from "./Template.module.less";

export function Template({
  path,
  children,
}: {
  readonly path: string;
  readonly children: ReactNode;
}) {
  const { user } = usePageData();
  return user == null ? (
    <div className={styles.login}>
      <main className={styles.loginMain}>
        {children}
        <PortalContainer />
        <Toaster />
        <Footer />
      </main>
    </div>
  ) : (
    <div className={styles.body}>
      <main className={styles.main}>
        {children}
        <PortalContainer />
        <Toaster />
      </main>
      <nav className={styles.nav}>
        <NavMenu currentPath={path} />
      </nav>
      <Footer />
      <EnvName />
    </div>
  );
}

function Footer() {
  const { sourceCodeUrl } = usePageData();
  return (
    <footer className={styles.footer}>
      Based on Keybr · AGPL-3.0 ·{" "}
      {sourceCodeUrl != null && <a href={sourceCodeUrl}>Source Code</a>}
    </footer>
  );
}

function EnvName() {
  return process.env.NODE_ENV === "production" ? null : (
    <div
      style={{
        position: "fixed",
        zIndex: "1",
        insetInlineEnd: "0px",
        insetBlockEnd: "0px",
        padding: "5px",
        margin: "5px",
        border: "1px solid red",
        color: "red",
      }}
    >
      {`process.env.NODE_ENV=${process.env.NODE_ENV}`}
    </div>
  );
}
