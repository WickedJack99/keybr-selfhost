import {
  body,
  controller,
  http,
  pathParam,
  queryParam,
} from "@fastr/controller";
import { Context } from "@fastr/core";
import { BadRequestError, NotFoundError } from "@fastr/errors";
import { injectable } from "@fastr/invert";
import { type RouterState } from "@fastr/middleware-router";
import { UserBook } from "@keybr/database";
import { z } from "zod";
import { type AuthState } from "../auth/index.ts";
import { zod as parseZod } from "../auth/zod.ts";
import { parseEpub } from "./epub.ts";

const MAX_EPUB_BYTES = 50 * 1024 * 1024;
const TBookId = parseZod(z.string().regex(/^[1-9][0-9]*$/u), () => {
  throw new BadRequestError("Invalid book id");
});
const TTitle = parseZod(z.string().trim().min(1).max(200), () => {
  throw new BadRequestError("Book title must be between 1 and 200 characters");
});
const PPosition = parseZod(
  z.object({
    characterIndex: z.number().int().min(0).max(10_000_000),
  }),
  () => {
    throw new BadRequestError("Invalid book position");
  },
);

@injectable()
@controller()
export class Controller {
  @http.GET("/_/books")
  async list(ctx: Context<RouterState & AuthState>) {
    const user = ctx.state.requireUser();
    ctx.response.body = (await UserBook.listForUser(user.id!)).map(toSummary);
  }

  @http.GET("/_/books/{id:[1-9][0-9]*}")
  async get(
    ctx: Context<RouterState & AuthState>,
    @pathParam("id", TBookId) id: string,
  ) {
    const book = await this.findBook(ctx, Number(id));
    ctx.response.body = toDetails(book);
  }

  @http.POST("/_/books")
  async upload(
    ctx: Context<RouterState & AuthState>,
    @queryParam("title", TTitle) title: string,
    @body.binary(null, { maxLength: MAX_EPUB_BYTES }) value: Buffer,
  ) {
    const user = ctx.state.requireUser();
    let parsed;
    try {
      parsed = parseEpub(value);
    } catch (err: any) {
      throw new BadRequestError(err.message);
    }
    const book = await UserBook.query().insertAndFetch({
      userId: user.id!,
      title,
      author: parsed.author,
      language: parsed.language,
      content: JSON.stringify(parsed.content),
      characterIndex: 0,
    });
    ctx.response.status = 201;
    ctx.response.body = toSummary(book);
  }

  @http.PATCH("/_/books/{id:[1-9][0-9]*}")
  async update(
    ctx: Context<RouterState & AuthState>,
    @pathParam("id", TBookId) id: string,
    @body.json(PPosition) { characterIndex }: { characterIndex: number },
  ) {
    const book = await this.findBook(ctx, Number(id));
    const max = textLength(book);
    await book.$query().patch({
      characterIndex: Math.min(characterIndex, max),
    });
    ctx.response.status = 204;
  }

  @http.DELETE("/_/books/{id:[1-9][0-9]*}")
  async delete(
    ctx: Context<RouterState & AuthState>,
    @pathParam("id", TBookId) id: string,
  ) {
    const book = await this.findBook(ctx, Number(id));
    await book.$query().delete();
    ctx.response.status = 204;
  }

  private async findBook(
    ctx: Context<RouterState & AuthState>,
    id: number,
  ): Promise<UserBook> {
    const user = ctx.state.requireUser();
    const book = await UserBook.findForUser(id, user.id!);
    if (book == null) {
      throw new NotFoundError();
    }
    return book;
  }
}

function toSummary(book: UserBook) {
  return {
    id: String(book.id),
    title: book.title,
    author: book.author,
    language: book.language,
    characterIndex: book.characterIndex ?? 0,
    characterCount: textLength(book),
  };
}

function toDetails(book: UserBook) {
  return {
    ...toSummary(book),
    content: JSON.parse(book.content!),
  };
}

function textLength(book: UserBook): number {
  const content = JSON.parse(book.content!) as readonly [
    string,
    readonly string[],
  ][];
  return content.flatMap(([, paragraphs]) => paragraphs).join("\n\n").length;
}
