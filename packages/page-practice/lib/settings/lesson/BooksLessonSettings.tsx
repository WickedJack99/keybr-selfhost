import {
  Book,
  BookPreview,
  BookSelector,
  type Content,
  ParagraphPreview,
  ParagraphSelector,
} from "@keybr/content";
import {
  loadUserBooks,
  updateUserBookPosition,
  uploadUserBook,
  userBookAsBook,
  type UserBookSummary,
} from "@keybr/content-books";
import { type BooksLesson, lessonProps } from "@keybr/lesson";
import { useSettings } from "@keybr/settings";
import {
  Button,
  CheckBox,
  Description,
  Explainer,
  Field,
  FieldList,
  FieldSet,
  Spacer,
  TextField,
} from "@keybr/widget";
import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { LessonLengthProp } from "./LessonLengthProp.tsx";
import { TargetSpeedProp } from "./TargetSpeedProp.tsx";

export function BooksLessonSettings({
  lesson,
}: {
  readonly lesson: BooksLesson;
}): ReactNode {
  const { formatMessage } = useIntl();
  const { settings, updateSettings } = useSettings();
  const { book, content, paragraphs, paragraphIndex } = lesson;
  const [userBooks, setUserBooks] = useState<readonly UserBookSummary[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadUserBooks()
      .then(setUserBooks)
      .catch((reason: Error) => setError(reason.message));
  }, []);
  const customBooks = useMemo(() => userBooks.map(userBookAsBook), [userBooks]);
  const lessonBook =
    Book.customId(book) == null
      ? (book as Book)
      : Book.createCustom(
          Book.customId(book)!,
          book.language,
          book.title,
          book.author,
        );
  const books = useMemo(() => {
    const values = [...Book.ALL, ...customBooks];
    if (
      Book.customId(lessonBook) != null &&
      !values.some(({ id }) => id === lessonBook.id)
    ) {
      values.push(lessonBook);
    }
    return values;
  }, [customBooks, lessonBook]);
  const customBookId = settings.get(lessonProps.books.customBookId);
  const selectedBook =
    books.find(({ id }) => id === lessonBook.id) ?? lessonBook;
  const selectedSummary = userBooks.find(({ id }) => id === customBookId);
  return (
    <>
      <Explainer>
        <Description>
          <FormattedMessage
            id="lessonType.books.description"
            defaultMessage="Generate typing lessons from the text of a book. All keys are included by default. This mode is for the pros."
          />
        </Description>
      </Explainer>
      <FieldSet
        legend={formatMessage({
          id: "t_Lesson_options",
          defaultMessage: "Lesson options",
        })}
      >
        <BookSelector
          book={selectedBook}
          books={books}
          onChange={(book) => {
            const customBookId = Book.customId(book);
            const customBook = userBooks.find(({ id }) => id === customBookId);
            updateSettings(
              settings
                .set(
                  lessonProps.books.customBookId,
                  customBookId == null ? "" : customBookId,
                )
                .set(
                  lessonProps.books.characterIndex,
                  customBook?.characterIndex ?? 0,
                )
                .set(
                  lessonProps.books.book,
                  customBookId == null
                    ? book
                    : settings.get(lessonProps.books.book),
                )
                .set(lessonProps.books.paragraphIndex, 0),
            );
          }}
        />
        <BookPreview book={selectedBook} content={content} />
        {customBookId === "" ? (
          <>
            <ParagraphSelector
              paragraphs={paragraphs}
              paragraphIndex={paragraphIndex}
              onChange={(paragraphIndex) => {
                updateSettings(
                  settings.set(
                    lessonProps.books.paragraphIndex,
                    paragraphIndex,
                  ),
                );
              }}
            />
            <ParagraphPreview
              paragraphs={paragraphs}
              paragraphIndex={paragraphIndex}
            />
          </>
        ) : (
          <BookPosition
            bookId={customBookId}
            characterCount={
              selectedSummary?.characterCount ?? characterCount(content)
            }
          />
        )}
        <UserBookUpload
          title={title}
          file={file}
          uploading={uploading}
          error={error}
          onTitleChange={setTitle}
          onFileChange={(event) => {
            setFile(event.currentTarget.files?.[0] ?? null);
          }}
          onUpload={async () => {
            if (file == null || title.trim() === "") {
              return;
            }
            setUploading(true);
            setError(null);
            try {
              const summary = await uploadUserBook(title.trim(), file);
              setUserBooks((books) => [...books, summary]);
              updateSettings(
                settings
                  .set(lessonProps.books.customBookId, summary.id)
                  .set(lessonProps.books.characterIndex, summary.characterIndex)
                  .set(lessonProps.books.paragraphIndex, 0),
              );
              setTitle("");
              setFile(null);
            } catch (reason: any) {
              setError(reason.message);
            } finally {
              setUploading(false);
            }
          }}
        />
        <Spacer size={3} />
        <BookTextProcessing />
        <TargetSpeedProp />
        <LessonLengthProp />
      </FieldSet>
    </>
  );
}

function BookPosition({
  bookId,
  characterCount,
}: {
  readonly bookId: string;
  readonly characterCount: number;
}): ReactNode {
  const { settings, updateSettings } = useSettings();
  const characterIndex = settings.get(lessonProps.books.characterIndex);
  const [value, setValue] = useState(String(characterIndex));
  useEffect(() => {
    setValue(String(characterIndex));
  }, [bookId, characterIndex]);
  useEffect(() => {
    const nextCharacterIndex = Math.max(
      0,
      Math.min(characterCount, Number.parseInt(value, 10) || 0),
    );
    const timeout = setTimeout(() => {
      updateUserBookPosition(bookId, nextCharacterIndex).catch(() => {});
    }, 300);
    return () => clearTimeout(timeout);
  }, [bookId, characterCount, value]);
  return (
    <FieldList>
      <Field>Start at character:</Field>
      <Field>
        <TextField
          type="number"
          size={16}
          min={0}
          max={characterCount}
          value={value}
          onChange={(nextValue) => {
            setValue(nextValue);
            const characterIndex = Math.max(
              0,
              Math.min(characterCount, Number.parseInt(nextValue, 10) || 0),
            );
            updateSettings(
              settings.set(lessonProps.books.characterIndex, characterIndex),
            );
          }}
        />
      </Field>
      <Field>of {characterCount} characters</Field>
    </FieldList>
  );
}

function UserBookUpload({
  title,
  file,
  uploading,
  error,
  onTitleChange,
  onFileChange,
  onUpload,
}: {
  readonly title: string;
  readonly file: File | null;
  readonly uploading: boolean;
  readonly error: string | null;
  readonly onTitleChange: (value: string) => void;
  readonly onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onUpload: () => void;
}): ReactNode {
  return (
    <FieldSet legend="Upload an EPUB">
      <FieldList>
        <Field>
          <TextField
            size={24}
            placeholder="Book title"
            value={title}
            onChange={onTitleChange}
          />
        </Field>
        <Field>
          <input
            type="file"
            accept=".epub,application/epub+zip"
            onChange={onFileChange}
          />
        </Field>
        <Field>
          <Button
            disabled={uploading || file == null || title.trim() === ""}
            label={uploading ? "Uploading..." : "Upload EPUB"}
            onClick={onUpload}
          />
        </Field>
      </FieldList>
      {error != null ? <p>{error}</p> : null}
    </FieldSet>
  );
}

function characterCount(content: Content): number {
  return content.flatMap(([, paragraphs]) => paragraphs).join("\n\n").length;
}

function BookTextProcessing(): ReactNode {
  const { formatMessage } = useIntl();
  const { settings, updateSettings } = useSettings();
  return (
    <FieldList>
      <Field>
        <CheckBox
          checked={settings.get(lessonProps.books.lettersOnly)}
          label={formatMessage({
            id: "t_Remove_punctuation_characters",
            defaultMessage: "Remove punctuation characters",
          })}
          title={formatMessage({
            id: "settings.customTextLettersOnly.description",
            defaultMessage:
              "Remove punctuation from the text to make it simpler to type.",
          })}
          onChange={(value) => {
            updateSettings(settings.set(lessonProps.books.lettersOnly, value));
          }}
        />
      </Field>
      <Field>
        <CheckBox
          checked={settings.get(lessonProps.books.lowercase)}
          label={formatMessage({
            id: "t_Transform_to_lowercase",
            defaultMessage: "Transform to lowercase",
          })}
          title={formatMessage({
            id: "settings.customTextLowercase.description",
            defaultMessage:
              "Transform all text to lower case to make it simpler to type.",
          })}
          onChange={(value) => {
            updateSettings(settings.set(lessonProps.books.lowercase, value));
          }}
        />
      </Field>
    </FieldList>
  );
}
