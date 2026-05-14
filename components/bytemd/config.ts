import breaks from "@bytemd/plugin-breaks";
import frontmatter from "@bytemd/plugin-frontmatter";
import gfm from "@bytemd/plugin-gfm";
import gfm_zhHans from "@bytemd/plugin-gfm/lib/locales/zh_Hans.json";
import highlightSSR from "@bytemd/plugin-highlight-ssr";
import mediumZoom from "@bytemd/plugin-medium-zoom";
import { type EditorProps } from "@bytemd/react";
import { merge } from "lodash-es";
import { all } from "lowlight";

import {
  codeBlockPlugin,
  headingPlugin,
  inlineCodePlugin,
  prettyLinkPlugin,
} from "./plugins";

export const plugins = [
  breaks(),
  frontmatter(),
  mediumZoom(),
  gfm({ locale: gfm_zhHans }),
  highlightSSR({
    ignoreMissing: true,
    languages: all,
  }),
  codeBlockPlugin(), // 添加代码块插件来设置data-language属性
  inlineCodePlugin(),
  prettyLinkPlugin(),
  headingPlugin(),
];

export const sanitize: EditorProps["sanitize"] = (schema) => {
  return merge(schema, {
    tagNames: ["iframe"],
    attributes: {
      iframe: [
        "src",
        "style",
        "title",
        "all",
        "sandbox",
        "scrolling",
        "border",
        "frameborder",
        "framespacing",
        "allowfullscreen",
      ],
    },
  } as typeof schema);
};
