import { test } from "node:test";
import { strToU8, zipSync } from "fflate";
import { deepEqual, equal, throws } from "rich-assert";
import { parseEpub } from "./epub.ts";

function epub() {
  return zipSync({
    "META-INF/container.xml": strToU8(`
      <?xml version="1.0"?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles><rootfile full-path="OPS/package.opf" /></rootfiles>
      </container>
    `),
    "OPS/package.opf": strToU8(`
      <package xmlns="http://www.idpf.org/2007/opf">
        <metadata>
          <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">An Author</dc:creator>
          <dc:language xmlns:dc="http://purl.org/dc/elements/1.1/">en-US</dc:language>
        </metadata>
        <manifest>
          <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml" />
        </manifest>
        <spine><itemref idref="chapter" /></spine>
      </package>
    `),
    "OPS/chapter.xhtml": strToU8(`
      <html><body>
        <h1>Chapter one</h1>
        <p>Hello <em>world</em>.</p>
        <p>Second paragraph.</p>
        <script>ignore this</script>
      </body></html>
    `),
  });
}

test("extract EPUB metadata and ordered paragraphs", () => {
  deepEqual(parseEpub(epub()), {
    author: "An Author",
    language: "en",
    content: [["1", ["Chapter one", "Hello world.", "Second paragraph."]]],
  });
});

test("reject EPUBs without readable text", () => {
  throws(
    () =>
      parseEpub(
        zipSync({
          "META-INF/container.xml": strToU8(
            '<container><rootfiles><rootfile full-path="book.opf" /></rootfiles></container>',
          ),
          "book.opf": strToU8(
            "<package><manifest></manifest><spine></spine></package>",
          ),
        }),
      ),
    /incomplete|readable/u,
  );
});
