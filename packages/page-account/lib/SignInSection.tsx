import { Article, Header } from "@keybr/widget";
import { AccountName } from "./AccountName.tsx";
import { type SignInActions } from "./actions.ts";
import { LocalLoginForm } from "./LocalLoginForm.tsx";

export function SignInSection({ actions }: { actions: SignInActions }) {
  return (
    <Article>
      <AccountName user={null} />
      <p>
        This instance stores your typing data locally and uses a
        password-protected local account.
      </p>
      <Header level={2}>Sign-in locally</Header>
      <LocalLoginForm actions={actions} />
    </Article>
  );
}
