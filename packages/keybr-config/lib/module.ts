import { type Binder, type Module } from "@fastr/invert";
import Knex from "knex";
import { Env } from "./env.ts";
import { makeKnex } from "./knex.ts";

export class ConfigModule implements Module {
  configure({ bind }: Binder): void {
    bind(Knex).toValue(makeKnex());
    bind("dataDir").toValue(
      Env.getPath("DATA_DIR", "/data"), //
    );
    bind("publicDir").toValue(
      Env.getPath("PUBLIC_DIR", "/opt/keybr/public"), //
    );
    bind("canonicalUrl").toValue(
      Env.getString("APP_URL", "https://www.keybr.com/"), //
    );
    bind("privateMode").toValue(
      Env.getBoolean("PRIVATE_MODE", process.env.NODE_ENV !== "test"),
    );
    bind("sourceCodeUrl").toValue(
      Env.getString("SOURCE_CODE_URL", "https://github.com/aradzie/keybr.com"),
    );
  }
}
