import { createInterface } from "node:readline/promises";
import { inject, injectable } from "@fastr/invert";
import { createSchema, User } from "@keybr/database";
import { Command, Option } from "commander";
import Knex, { type Knex as KnexInstance } from "knex";

const input = process.stdin;
const output = process.stdout;

@injectable()
export class UserCreateCommand {
  constructor(@inject(Knex) readonly knex: KnexInstance) {}

  command() {
    return new Command("user-create")
      .description("Create or update the private local user.")
      .addOption(
        new Option(
          "--username <username>",
          "Local username.",
        ).makeOptionMandatory(),
      )
      .addOption(
        new Option(
          "--password-stdin",
          "Read the password from standard input instead of prompting.",
        ),
      )
      .action(this.action.bind(this));
  }

  async action({
    username,
    passwordStdin = false,
  }: {
    readonly username: string;
    readonly passwordStdin?: boolean;
  }) {
    await createSchema(this.knex);
    const password = passwordStdin
      ? await readPasswordFromStdin()
      : await promptPassword();
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    const confirmation = passwordStdin
      ? password
      : await promptPassword("Confirm password: ");
    if (password !== confirmation) {
      throw new Error("Passwords do not match.");
    }
    const user = await User.ensureLocal({ username, password });
    console.log(`Local user '${user.name}' is ready.`);
  }
}

async function promptPassword(prompt = "Password: "): Promise<string> {
  if (!input.isTTY || !output.isTTY || input.setRawMode == null) {
    const readline = createInterface({ input, output });
    try {
      return await readline.question(prompt);
    } finally {
      readline.close();
    }
  }

  output.write(prompt);
  input.setRawMode(true);
  input.resume();
  return await new Promise<string>((resolve, reject) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Password entry cancelled."));
        } else if (character === "\r" || character === "\n") {
          cleanup();
          output.write("\n");
          resolve(value);
        } else if (character === "\u007f") {
          value = value.substring(0, value.length - 1);
        } else {
          value += character;
        }
      }
    };
    const cleanup = () => {
      input.setRawMode?.(false);
      input.pause();
      input.off("data", onData);
    };
    input.on("data", onData);
  });
}

async function readPasswordFromStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString().trimEnd();
}
