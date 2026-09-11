import { Book, type BookContent } from "@keybr/content";
import { Language } from "@keybr/keyboard";
import { request } from "@keybr/request";

export type UserBookSummary = {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly language: string;
  readonly paragraphIndex: number;
  readonly paragraphCount: number;
};

export type UserBookContent = BookContent & {
  readonly paragraphIndex: number;
  readonly paragraphCount: number;
};

export async function loadUserBooks(): Promise<readonly UserBookSummary[]> {
  const response = await request.GET("/_/books").send();
  return (await response.json()) as UserBookSummary[];
}

export async function loadUserBook(id: string): Promise<UserBookContent> {
  const response = await request
    .GET("/_/books/" + encodeURIComponent(id))
    .send();
  const value = (await response.json()) as UserBookResponse;
  const book = Book.createCustom(
    value.id,
    languageOf(value.language),
    value.title,
    value.author,
  );
  return {
    book,
    content: value.content,
    paragraphIndex: value.paragraphIndex,
    paragraphCount: value.paragraphCount,
  };
}

export async function uploadUserBook(
  title: string,
  file: File,
): Promise<UserBookSummary> {
  const response = await request
    .POST("/_/books?title=" + encodeURIComponent(title))
    .send(new Uint8Array(await file.arrayBuffer()));
  return (await response.json()) as UserBookSummary;
}

export async function updateUserBookParagraph(
  id: string,
  paragraphIndex: number,
): Promise<void> {
  const response = await request
    .PATCH("/_/books/" + encodeURIComponent(id))
    .send({ paragraphIndex });
  await response.blob();
}

export async function deleteUserBook(id: string): Promise<void> {
  const response = await request
    .DELETE("/_/books/" + encodeURIComponent(id))
    .send();
  await response.blob();
}

export function userBookAsBook(summary: UserBookSummary): Book {
  return Book.createCustom(
    summary.id,
    languageOf(summary.language),
    summary.title,
    summary.author,
  );
}

type UserBookResponse = UserBookSummary & {
  readonly content: BookContent["content"];
};

function languageOf(id: string): Language {
  return Language.ALL.get(id, Language.EN);
}
