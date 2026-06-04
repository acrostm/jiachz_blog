import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";

export type HastProperties = Record<string, unknown>;

export type HastText = {
  type: "text";
  value: string;
};

export type HastElement = {
  type: "element";
  tagName: string;
  properties?: HastProperties;
  children: HastNode[];
};

export type HastRoot = {
  type: "root";
  children: HastNode[];
};

export type HastNode =
  | HastElement
  | HastText
  | {
      type: string;
      [key: string]: unknown;
    };

export type HastParent = {
  children: HastNode[];
};

export const isElement = (node: unknown): node is HastElement =>
  typeof node === "object" &&
  node !== null &&
  (node as { type?: unknown }).type === "element";

export const isText = (node: unknown): node is HastText =>
  typeof node === "object" &&
  node !== null &&
  (node as { type?: unknown }).type === "text" &&
  typeof (node as { value?: unknown }).value === "string";

export const createElementFromHtml = (html: string): HastElement => {
  const fragment = fromHtmlIsomorphic(html, {
    fragment: true,
  }) as unknown as {
    children: unknown[];
  };
  const element = fragment.children.find(isElement);

  if (!element) {
    throw new Error("Expected HTML fragment to contain an element");
  }

  return element;
};

export const cloneHastNode = <T extends HastNode>(node: T): T =>
  structuredClone(node);

export const getStringProperty = (
  properties: HastElement["properties"],
  key: string,
) => {
  const value = properties?.[key];
  return typeof value === "string" ? value : undefined;
};

export const getClassNames = (properties: HastElement["properties"]) => {
  const value = properties?.className;

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
};

export const appendClassName = (node: HastElement, className: string) => {
  node.properties ??= {};
  const classNames = getClassNames(node.properties);

  if (!classNames.includes(className)) {
    node.properties.className = [...classNames, className];
  }
};
