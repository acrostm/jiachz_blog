import type { Element, RootContent, Text } from "hast";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";

export const isElement = (node: unknown): node is Element =>
  typeof node === "object" &&
  node !== null &&
  (node as { type?: unknown }).type === "element";

export const isText = (node: unknown): node is Text =>
  typeof node === "object" &&
  node !== null &&
  (node as { type?: unknown }).type === "text" &&
  typeof (node as { value?: unknown }).value === "string";

export const createElementFromHtml = (html: string): Element => {
  const element = fromHtmlIsomorphic(html, { fragment: true }).children.find(
    isElement,
  ) as Element | undefined;

  if (!element) {
    throw new Error("Expected HTML fragment to contain an element");
  }

  return element;
};

export const cloneHastNode = <T extends RootContent>(node: T): T =>
  JSON.parse(JSON.stringify(node)) as T;

export const getStringProperty = (
  properties: Element["properties"],
  key: string,
) => {
  const value = properties?.[key];
  return typeof value === "string" ? value : undefined;
};

export const getClassNames = (properties: Element["properties"]) => {
  const value = properties?.className;

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
};

export const appendClassName = (node: Element, className: string) => {
  node.properties ??= {};
  const classNames = getClassNames(node.properties);

  if (!classNames.includes(className)) {
    node.properties.className = [...classNames, className];
  }
};
