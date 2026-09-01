import { Button, Field, FieldList, Icon, Para, TextField } from "@keybr/widget";
import { mdiLogin } from "@mdi/js";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { type SignInActions } from "./actions.ts";

export function LocalLoginForm({ actions }: { actions: SignInActions }) {
  const { formatMessage } = useIntl();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const login = () => {
    if (username === "" || password === "") {
      return;
    }
    setSending(true);
    setError(null);
    actions
      .loginLocal(username.trim(), password)
      .then(() => {
        window.location.href = "/";
      })
      .catch((reason) => {
        setSending(false);
        setError(reason.message);
      });
  };

  return (
    <>
      <FieldList>
        <Field>
          <TextField
            size={24}
            type="text"
            placeholder="Username"
            value={username}
            onChange={setUsername}
          />
        </Field>
        <Field>
          <TextField
            size={24}
            type="password"
            placeholder={formatMessage({
              id: "t_Password",
              defaultMessage: "Password",
            })}
            value={password}
            onChange={setPassword}
          />
        </Field>
        <Field>
          <Button
            size={16}
            icon={<Icon shape={mdiLogin} />}
            label={
              sending
                ? "Signing in..."
                : formatMessage({
                    id: "t_Sign_In",
                    defaultMessage: "Sign in",
                  })
            }
            onClick={login}
          />
        </Field>
      </FieldList>

      <Para>
        {error != null
          ? `Could not sign in: ${error}`
          : "Use the local account configured for this self-hosted instance."}
      </Para>
    </>
  );
}
