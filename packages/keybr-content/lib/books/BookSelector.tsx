import { Field, FieldList, OptionList } from "@keybr/widget";
import { type ReactNode } from "react";
import { Book } from "./book.ts";

export function BookSelector({
  book,
  books = [...Book.ALL],
  onChange,
}: {
  readonly book: Book;
  readonly books?: readonly Book[];
  readonly onChange: (book: Book) => void;
}): ReactNode {
  return (
    <FieldList>
      <Field>Book:</Field>
      <Field>
        <OptionList
          size={24}
          options={books.map(({ id, title }) => ({
            value: id,
            name: title,
          }))}
          value={book.id}
          onSelect={(value) => {
            const book = books.find((book) => book.id === value);
            if (book != null) {
              onChange(book);
            }
          }}
        />
      </Field>
    </FieldList>
  );
}
