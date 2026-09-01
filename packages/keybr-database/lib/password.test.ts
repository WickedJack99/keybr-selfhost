import { test } from "node:test";
import { equal, isFalse, isTrue } from "rich-assert";
import { hashPassword, verifyPassword } from "./password.ts";

test("hash and verify password", async () => {
  const encoded = await hashPassword("correct horse battery staple");

  isTrue(await verifyPassword("correct horse battery staple", encoded));
  isFalse(await verifyPassword("incorrect password", encoded));
  isFalse(
    await verifyPassword(
      "correct horse battery staple",
      encoded.substring(0, encoded.length - 1) + "0",
    ),
  );
  equal(encoded.split("$").length, 6);
});
