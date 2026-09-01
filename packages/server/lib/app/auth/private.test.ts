import { test } from "node:test";
import { Application } from "@fastr/core";
import { hashPassword, User } from "@keybr/database";
import { equal } from "rich-assert";
import { kMain } from "../module.ts";
import { TestContext } from "../test/context.ts";
import { startApp } from "../test/request.ts";

const context = new TestContext();
context.bind("canonicalUrl").toValue("*");
context.bind("privateMode").toValue(true);

test("redirect anonymous browser pages to login", async () => {
  const request = startApp(context.get(Application, kMain));
  const response = await request.GET("/").send();

  equal(response.status, 302);
  equal(response.headers.get("location"), "/login");
});

test("allow the login page anonymously", async () => {
  const response = await startApp(context.get(Application, kMain))
    .GET("/login")
    .send();

  equal(response.status, 200);
});

test("reject anonymous APIs and disabled public pages", async () => {
  const request = startApp(context.get(Application, kMain));

  equal((await request.GET("/_/sync/data").send()).status, 401);
  equal((await request.GET("/high-scores").send()).status, 404);
});

test("allow the private user and destroy the session on logout", async () => {
  await User.query().insert({
    email: "local@local.invalid",
    name: "local",
    passwordHash: await hashPassword("correct horse battery staple"),
  });
  const request = startApp(context.get(Application, kMain));
  const login = await request.POST("/auth/local-login").send({
    username: "local",
    password: "correct horse battery staple",
  });
  equal(login.status, 204);

  equal((await request.GET("/").send()).status, 200);
  equal((await request.GET("/multiplayer").send()).status, 404);

  const response = await request.GET("/auth/logout").send();
  equal(response.status, 302);
  equal((await request.GET("/").send()).status, 302);
});
