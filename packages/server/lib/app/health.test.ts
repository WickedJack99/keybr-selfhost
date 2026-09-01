import { test } from "node:test";
import { Application } from "@fastr/core";
import { deepEqual, equal } from "rich-assert";
import { kMain } from "./module.ts";
import { TestContext } from "./test/context.ts";
import { startApp } from "./test/request.ts";

const context = new TestContext();

test("healthcheck verifies the database", async () => {
  const response = await startApp(context.get(Application, kMain))
    .GET("/healthz")
    .send();

  equal(response.status, 200);
  deepEqual(await response.body.json(), { status: "ok" });
});
