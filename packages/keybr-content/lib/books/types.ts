import { type Language } from "@keybr/keyboard";

export type Content = readonly Chapter[];

export type Chapter = readonly [title: string, para: readonly string[]];

export type BookInfo = {
  readonly id: string;
  readonly language: Language;
  readonly title: string;
  readonly author: string;
  readonly coverImage: string | null;
};

export type BookContent = {
  readonly book: BookInfo;
  readonly content: Content;
  readonly characterIndex?: number;
};
