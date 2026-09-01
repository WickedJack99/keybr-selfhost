import { test } from "node:test";
import { CookieJar } from "@fastr/client-testlib";
import { Application } from "@fastr/core";
import { hashPassword, User } from "@keybr/database";
import { equal, isNull } from "rich-assert";
import { kMain } from "../module.ts";
import { TestContext } from "../test/context.ts";
import { startApp } from "../test/request.ts";

const context = new TestContext();

test("login with a local password and keep the session in the file store", async () => {
  await User.query().insert({
    email: "local@local.invalid",
    name: "local",
    passwordHash: await hashPassword("correct horse battery staple"),
  });

  const app = context.get(Application, kMain);
  const jar = new CookieJar();
  const firstBrowser = startApp(app, jar);
  const response = await firstBrowser.POST("/auth/local-login").send({
    username: "local",
    password: "correct horse battery staple",
  });

  equal(response.status, 204);
  equal(await firstBrowser.who(), "local@local.invalid");

  const secondBrowser = startApp(app, jar);
  equal(await secondBrowser.who(), "local@local.invalid");
});

test("reject invalid local password", async () => {
  await User.query().insert({
    email: "local@local.invalid",
    name: "local",
    passwordHash: await hashPassword("correct horse battery staple"),
  });

  const request = startApp(context.get(Application, kMain));
  const response = await request.POST("/auth/local-login").send({
    username: "local",
    password: "wrong password",
  });

  equal(response.status, 403);
  isNull(await request.who());
});
