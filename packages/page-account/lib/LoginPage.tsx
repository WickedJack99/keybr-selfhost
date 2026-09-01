import { Article, Header, Para } from "@keybr/widget";
import { useSignInActions } from "./actions.ts";
import { LocalLoginForm } from "./LocalLoginForm.tsx";

export function LoginPage() {
  const { actions } = useSignInActions();
  return (
    <Article>
      <Header level={1}>Typing</Header>
      <Para>Private typing practice powered by Keybr.</Para>
      <LocalLoginForm actions={actions} />
    </Article>
  );
}
