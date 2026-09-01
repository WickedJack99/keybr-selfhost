import { usePageData } from "@keybr/pages-shared";
import { Article, Header, Para } from "@keybr/widget";
import { useSignInActions } from "./actions.ts";
import { LocalLoginForm } from "./LocalLoginForm.tsx";

export function LoginPage() {
  const { sourceCodeUrl } = usePageData();
  const { actions } = useSignInActions();
  return (
    <Article>
      <Header level={1}>Typing</Header>
      <Para>Private typing practice powered by Keybr.</Para>
      <LocalLoginForm actions={actions} />
      <Para>
        <small>
          Based on Keybr · AGPL-3.0 ·{" "}
          {sourceCodeUrl != null && sourceCodeUrl !== "" ? (
            <a href={sourceCodeUrl}>Source Code</a>
          ) : null}
        </small>
      </Para>
    </Article>
  );
}
