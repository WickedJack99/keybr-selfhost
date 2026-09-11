import { test } from "node:test";
import { Application } from "@fastr/core";
import { strToU8, zipSync } from "fflate";
import { deepEqual, equal, like } from "rich-assert";
import { kMain } from "../module.ts";
import { TestContext } from "../test/context.ts";
import { startApp } from "../test/request.ts";
import { findUser } from "../test/sql.ts";

const context = new TestContext();

function epub() {
  return zipSync({
    "META-INF/container.xml": strToU8(
      '<container><rootfiles><rootfile full-path="book.opf" /></rootfiles></container>',
    ),
    "book.opf": strToU8(`
      <package>
        <metadata><creator>Author</creator><language>en</language></metadata>
        <manifest><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml" /></manifest>
        <spine><itemref idref="chapter" /></spine>
      </package>
    `),
    "chapter.xhtml": strToU8("<html><body><p>One two three.</p></body></html>"),
  });
}

test("upload and persist a user's book position", async () => {
  const request = startApp(context.get(Application, kMain));
  await request.become((await findUser("user1@keybr.com")).id!);

  const upload = await request.POST("/_/books?title=My%20Book").send(epub());
  equal(upload.status, 201);
  const summary = await upload.body.json<{
    id: string;
    title: string;
    characterCount: number;
  }>();
  like(summary, { title: "My Book", characterCount: 14 });

  equal(
    (
      await request
        .PATCH("/_/books/" + summary.id)
        .send({ characterIndex: 999 })
    ).status,
    204,
  );

  const book = await request.GET("/_/books/" + summary.id).send();
  equal(book.status, 200);
  deepEqual(await book.body.json(), {
    id: summary.id,
    title: "My Book",
    author: "Author",
    language: "en",
    characterIndex: 14,
    characterCount: 14,
    content: [["1", ["One two three."]]],
  });
});
