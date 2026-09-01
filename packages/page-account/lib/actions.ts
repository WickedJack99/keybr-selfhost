import { type AnyUser, type UserDetails } from "@keybr/pages-shared";
import { AccountService } from "./service.ts";

export type AccountActions = {
  readonly logout: () => void;
};

export type SignInActions = {
  readonly registerEmail: (email: string) => Promise<unknown>;
  readonly loginLocal: (username: string, password: string) => Promise<void>;
};

export function useAccountActions(props: {
  user: UserDetails;
  publicUser: AnyUser;
}) {
  const { user, publicUser } = props;

  return {
    user,
    publicUser,
    actions: {
      logout: () => reload("/auth/logout"),
    } as AccountActions,
  };
}

export function useSignInActions() {
  const registerEmail = (email: string) => {
    return AccountService.registerEmail(email);
  };
  const loginLocal = (username: string, password: string) => {
    return AccountService.loginLocal(username, password);
  };
  return {
    actions: {
      registerEmail,
      loginLocal,
    } as SignInActions,
  };
}

function reload(path: string) {
  window.location.href = path;
}
