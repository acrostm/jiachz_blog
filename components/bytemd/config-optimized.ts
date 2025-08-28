import { type EditorProps } from "@bytemd/react";
import { merge } from "lodash-es";

// 核心插件 - 总是加载
const loadCorePlugins = async () => {
  const [breaks, frontmatter] = await Promise.all([
    import("@bytemd/plugin-breaks").then((mod) => mod.default),
    import("@bytemd/plugin-frontmatter").then((mod) => mod.default),
  ]);

  return [breaks(), frontmatter()];
};

// 扩展插件 - 按需加载
const loadExtendedPlugins = async () => {
  const [gfm, gfm_zhHans, mediumZoom] = await Promise.all([
    import("@bytemd/plugin-gfm").then((mod) => mod.default),
    import("@bytemd/plugin-gfm/lib/locales/zh_Hans.json").then(
      (mod) => mod.default,
    ),
    import("@bytemd/plugin-medium-zoom").then((mod) => mod.default),
  ]);

  return [gfm({ locale: gfm_zhHans }), mediumZoom()];
};

// 语法高亮插件 - 延迟加载
const loadHighlightPlugin = async () => {
  const [highlightSSR, { common }] = await Promise.all([
    import("@bytemd/plugin-highlight-ssr").then((mod) => mod.default),
    import("lowlight").then((mod) => ({ common: mod.common })),
  ]);

  // 动态加载额外的语言支持
  const additionalLanguages = await Promise.all([
    import("highlight.js/lib/languages/dart").then((mod) => ({
      dart: mod.default,
    })),
    import("highlight.js/lib/languages/java").then((mod) => ({
      java: mod.default,
    })),
    import("highlight.js/lib/languages/nginx").then((mod) => ({
      nginx: mod.default,
    })),
    import("highlight.js/lib/languages/asciidoc").then((mod) => ({
      asciidoc: mod.default,
    })),
  ]);

  const languages = additionalLanguages.reduce(
    (acc, lang) => ({ ...acc, ...lang }),
    {},
  );

  return highlightSSR({
    languages: {
      ...common,
      ...languages,
    },
  });
};

// 自定义插件 - 延迟加载
const loadCustomPlugins = async () => {
  const [
    { codeBlockPlugin },
    { inlineCodePlugin },
    { prettyLinkPlugin },
    { headingPlugin },
  ] = await Promise.all([
    import("./plugins/code-block"),
    import("./plugins/inline-code"),
    import("./plugins/pretty-link"),
    import("./plugins/heading"),
  ]);

  return [
    codeBlockPlugin(),
    inlineCodePlugin(),
    prettyLinkPlugin(),
    headingPlugin(),
  ];
};

// 插件缓存
let pluginsCache: unknown[] | null = null;
let corePluginsCache: unknown[] | null = null;

// 获取核心插件（用于快速渲染）
export const getCorePlugins = async () => {
  if (corePluginsCache) return corePluginsCache;

  corePluginsCache = await loadCorePlugins();
  return corePluginsCache;
};

// 获取完整插件集合
export const getOptimizedPlugins = async (loadAll = true) => {
  if (!loadAll) {
    return getCorePlugins();
  }

  if (pluginsCache) return pluginsCache;

  try {
    const [corePlugins, extendedPlugins, highlightPlugin, customPlugins] =
      await Promise.all([
        loadCorePlugins(),
        loadExtendedPlugins(),
        loadHighlightPlugin(),
        loadCustomPlugins(),
      ]);

    pluginsCache = [
      ...corePlugins,
      ...extendedPlugins,
      highlightPlugin,
      ...customPlugins,
    ];

    return pluginsCache;
  } catch (error) {
    // 在生产环境中也需要警告，因为这影响功能
    console.warn(
      "Failed to load some plugins, falling back to core plugins:",
      error,
    );
    return getCorePlugins();
  }
};

// 清理插件缓存
export const clearPluginsCache = () => {
  pluginsCache = null;
  corePluginsCache = null;
};

// 优化的 sanitize 配置
export const optimizedSanitize: EditorProps["sanitize"] = (schema) => {
  return merge(schema, {
    tagNames: ["iframe"],
    attributes: {
      iframe: [
        "src",
        "style",
        "title",
        "sandbox",
        "scrolling",
        "border",
        "frameborder",
        "allowfullscreen",
      ],
    },
  } as typeof schema);
};
