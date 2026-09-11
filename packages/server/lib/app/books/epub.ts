import { unzipSync } from "fflate";
import { xml2js } from "xml-js";

const MAX_ENTRIES = 4096;
const MAX_TEXT_LENGTH = 10_000_000;

type XmlNode = {
  readonly type?: string;
  readonly name?: string;
  readonly text?: string;
  readonly cdata?: string;
  readonly attributes?: Record<string, string>;
  readonly elements?: readonly XmlNode[];
};

export type ParsedEpub = {
  readonly author: string;
  readonly language: string;
  readonly content: readonly (readonly [string, readonly string[]])[];
};

export function parseEpub(buffer: Uint8Array): ParsedEpub {
  const files = unzipSync(buffer);
  const paths = Object.keys(files);
  if (paths.length > MAX_ENTRIES) {
    throw new Error("The EPUB contains too many files.");
  }

  const container = parseXml(readFile(files, "META-INF/container.xml"));
  const rootfile = findElement(container, "rootfile");
  const packagePath = rootfile?.attributes?.["full-path"];
  if (packagePath == null) {
    throw new Error("The EPUB does not contain a package document.");
  }

  const packageDocument = parseXml(readFile(files, packagePath));
  const metadata = findElement(packageDocument, "metadata");
  const manifest = findElement(packageDocument, "manifest");
  const spine = findElement(packageDocument, "spine");
  if (manifest == null || spine == null) {
    throw new Error("The EPUB package document is incomplete.");
  }

  const manifestItems = new Map<string, XmlNode>();
  for (const item of children(manifest, "item")) {
    const id = item.attributes?.id;
    if (id != null) {
      manifestItems.set(id, item);
    }
  }

  const packageDirectory = directoryOf(packagePath);
  const content: Array<readonly [string, readonly string[]]> = [];
  for (const itemref of children(spine, "itemref")) {
    const idref = itemref.attributes?.idref;
    const item = idref == null ? null : manifestItems.get(idref);
    if (item == null) {
      continue;
    }
    const href = item.attributes?.href;
    if (href == null || !isTextDocument(item.attributes?.["media-type"])) {
      continue;
    }
    const path = resolvePath(packageDirectory, href);
    const document = parseXml(readFile(files, path));
    const body = findElement(document, "body");
    if (body == null) {
      continue;
    }
    const paragraphs = extractParagraphs(body);
    if (paragraphs.length > 0) {
      content.push([String(content.length + 1), paragraphs]);
    }
  }

  if (content.length === 0) {
    throw new Error("The EPUB does not contain readable text.");
  }

  const textLength = content
    .flatMap(([, paragraphs]) => paragraphs)
    .reduce((length, paragraph) => length + paragraph.length, 0);
  if (textLength > MAX_TEXT_LENGTH) {
    throw new Error("The extracted EPUB text is too large.");
  }

  return {
    author:
      metadata == null ? "Unknown author" : metadataValue(metadata, "creator"),
    language: normalizeLanguage(
      metadata == null ? null : metadataValue(metadata, "language"),
    ),
    content,
  };
}

function parseXml(value: string): XmlNode {
  try {
    return xml2js(value, {
      compact: false,
      trim: false,
      nativeType: false,
    }) as XmlNode;
  } catch {
    throw new Error("The EPUB contains invalid XML.");
  }
}

function readFile(files: Record<string, Uint8Array>, path: string): string {
  const file = files[path] ?? files[decodeURIComponent(path)];
  if (file == null) {
    throw new Error("The EPUB is missing " + path + ".");
  }
  return new TextDecoder().decode(file);
}

function children(node: XmlNode, name: string): readonly XmlNode[] {
  return (node.elements ?? []).filter(
    (child) => child.type === "element" && localName(child.name) === name,
  );
}

function findElement(node: XmlNode, name: string): XmlNode | null {
  if (node.type === "element" && localName(node.name) === name) {
    return node;
  }
  for (const child of node.elements ?? []) {
    const result = findElement(child, name);
    if (result != null) {
      return result;
    }
  }
  return null;
}

function metadataValue(metadata: XmlNode, name: string): string {
  const element = (metadata.elements ?? []).find(
    (child) => child.type === "element" && localName(child.name) === name,
  );
  return element == null ? "" : textContent(element);
}

function textContent(node: XmlNode): string {
  let text = node.text ?? node.cdata ?? "";
  for (const child of node.elements ?? []) {
    text += textContent(child);
  }
  return text;
}

function extractParagraphs(body: XmlNode): readonly string[] {
  const paragraphs: string[] = [];
  visit(body);
  if (paragraphs.length > 0) {
    return paragraphs;
  }
  const fallback = normalizeText(textContent(body));
  return fallback === "" ? [] : [fallback];

  function visit(node: XmlNode): void {
    if (node.type === "element") {
      const name = localName(node.name);
      if (name === "script" || name === "style" || name === "nav") {
        return;
      }
      if (
        name === "p" ||
        name === "li" ||
        name === "blockquote" ||
        name === "pre" ||
        /^h[1-6]$/u.test(name)
      ) {
        const paragraph = normalizeText(textContent(node));
        if (paragraph !== "") {
          paragraphs.push(paragraph);
        }
        return;
      }
    }
    for (const child of node.elements ?? []) {
      visit(child);
    }
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function localName(name: string | undefined): string {
  return (name ?? "").split(":").pop()!.toLowerCase();
}

function isTextDocument(mediaType: string | undefined): boolean {
  return mediaType === "application/xhtml+xml" || mediaType === "text/html";
}

function directoryOf(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.substring(0, index + 1);
}

function resolvePath(directory: string, href: string): string {
  const cleanHref = decodeURIComponent(href.split("#", 1)[0].split("?", 1)[0]);
  const parts = (directory + cleanHref).split("/");
  const result: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") {
      continue;
    }
    if (part === "..") {
      result.pop();
    } else {
      result.push(part);
    }
  }
  return result.join("/");
}

function normalizeLanguage(value: string | null): string {
  const language = (value ?? "").trim().toLowerCase().split("-", 1)[0];
  return /^[a-z]{2}$/u.test(language) ? language : "en";
}
