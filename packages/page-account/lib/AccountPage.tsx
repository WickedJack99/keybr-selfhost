import {
  type AnyUser,
  usePageData,
  type UserDetails,
} from "@keybr/pages-shared";
import { AccountSection } from "./AccountSection.tsx";
import { useAccountActions } from "./actions.ts";
import { LoginPage } from "./LoginPage.tsx";

export function AccountPage() {
  const { user, publicUser } = usePageData();
  if (user != null) {
    return <AccountSectionWithActions user={user} publicUser={publicUser} />;
  } else {
    return <LoginPage />;
  }
}

function AccountSectionWithActions(props: {
  user: UserDetails;
  publicUser: AnyUser;
}) {
  const { user, publicUser, actions } = useAccountActions(props);
  return (
    <AccountSection user={user} publicUser={publicUser} actions={actions} />
  );
}
