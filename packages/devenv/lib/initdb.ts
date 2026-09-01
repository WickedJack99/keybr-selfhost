#!/usr/bin/env -S node --import @keybr/tsl

import { Container } from "@fastr/invert";
import { ConfigModule, Env } from "@keybr/config";
import { createSchema } from "@keybr/database";
import { Logger } from "@keybr/logger";
import Knex from "knex";

Env.probeFilesSync();
const container = new Container();
container.load(new ConfigModule());
const knex = container.get(Knex);

async function exec() {
  try {
    await createSchema(knex);
    Logger.info(`Database schema was created.`);
  } finally {
    await knex.destroy();
  }
}

exec().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
