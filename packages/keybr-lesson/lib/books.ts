import {
  type BookContent,
  type BookInfo,
  type Content,
  flattenContent,
  splitParagraph,
} from "@keybr/content";
import { filterText, type Keyboard } from "@keybr/keyboard";
import { clamp } from "@keybr/lang";
import { type PhoneticModel } from "@keybr/phonetic-model";
import { type KeyStatsMap } from "@keybr/result";
import { type Settings } from "@keybr/settings";
import { LessonKeys } from "./key.ts";
import { Lesson } from "./lesson.ts";
import { lessonProps } from "./settings.ts";
import { Target } from "./target.ts";
import { generateFragment } from "./text/fragment.ts";
import { wordSequence } from "./text/words.ts";

export class BooksLesson extends Lesson {
  readonly book: BookInfo;
  readonly content: Content;
  readonly paragraphs: readonly string[];
  readonly paragraphIndex: number;
  readonly wordList: readonly string[];
  wordIndex = 0;

  constructor(
    settings: Settings,
    keyboard: Keyboard,
    model: PhoneticModel,
    { book, content, paragraphIndex }: BookContent,
  ) {
    super(settings, keyboard, model);
    this.book = book;
    this.content = content;
    this.paragraphs = this.#flattenContent(content);
    const configuredParagraphIndex = this.settings.get(
      lessonProps.books.paragraphIndex,
    );
    const lastParagraphIndex = Math.max(0, this.paragraphs.length - 1);
    const start = clamp(
      paragraphIndex ?? configuredParagraphIndex,
      0,
      lastParagraphIndex,
    );
    this.paragraphIndex = start;
    this.wordList = [
      ...this.paragraphs.slice(start),
      ...this.paragraphs.slice(0, start),
    ]
      .map(splitParagraph)
      .flat();
  }

  override get letters() {
    return this.model.letters;
  }

  override update(keyStatsMap: KeyStatsMap) {
    return LessonKeys.includeAll(keyStatsMap, new Target(this.settings));
  }

  override generate() {
    return generateFragment(this.settings, wordSequence(this.wordList, this));
  }

  #flattenContent(content: Content) {
    const lettersOnly = this.settings.get(lessonProps.books.lettersOnly);
    const lowercase = this.settings.get(lessonProps.books.lowercase);
    const codePoints = new Set(this.keyboard.getCodePoints());
    if (lettersOnly) {
      for (const codePoint of codePoints) {
        if (!this.model.language.includes(codePoint)) {
          codePoints.delete(codePoint);
        }
      }
    }
    return flattenContent(content).map((paragraph) => {
      let text = filterText(paragraph, codePoints);
      if (lowercase) {
        text = this.model.language.lowerCase(text);
      }
      return text;
    });
  }
}
