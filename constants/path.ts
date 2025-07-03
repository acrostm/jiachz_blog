import { NICKNAME } from ".";

export const PATHS = {
  /** ************* SITE ****************** */
  SITE_HOME: "/",
  SITE_BLOG: "/blog",
  SITE_SNIPPET: "/snippet",
  SITE_COMING: "/coming-soon",
  SITE_ABOUT: "/about",
  SITE_MESSAGES: "/messages",
  SITE_PROFILE: "/admin/profile",
  SITEMAP: "/sitemap.xml",

  /** ************* ADMIN ****************** */
  ADMIN_HOME: "/admin",
  ADMIN_STATISTIC: "/admin/statistic",

  ADMIN_BLOG: "/admin/blog",
  ADMIN_BLOG_CREATE: "/admin/blog/create",
  ADMIN_BLOG_EDIT: "/admin/blog/edit",

  ADMIN_SNIPPET: "/admin/snippet",
  ADMIN_SNIPPET_CREATE: "/admin/snippet/create",
  ADMIN_SNIPPET_EDIT: "/admin/snippet/edit",

  ADMIN_TAG: "/admin/tag",
  ADMIN_NOTE: "/admin/note",

  /** ************* AUTH ****************** */
  AUTH_SIGN_IN: "/auth/sign_in",
  AUTH_SIGN_UP: "/auth/sign_up",
  NEXT_AUTH_SIGN_IN: "/api/auth/sign_in",
};

export const PATHS_MAP: Record<string, string> = {
  /** ************* SITE ****************** */
  [PATHS.SITE_HOME]: "首页",
  [PATHS.SITE_BLOG]: "博客",
  [PATHS.SITE_SNIPPET]: "片段",
  [PATHS.SITE_COMING]: "实验室",
  [PATHS.SITE_PROFILE]: "个人资料",
  [PATHS.SITE_ABOUT]: "关于",
  [PATHS.SITEMAP]: "站点地图",

  /** ************* ADMIN ****************** */
  [PATHS.ADMIN_HOME]: "首页",
  [PATHS.ADMIN_STATISTIC]: "统计",
  [PATHS.ADMIN_BLOG]: "博客",
  [PATHS.ADMIN_BLOG_CREATE]: "创建博客",
  [PATHS.ADMIN_BLOG_EDIT]: "编辑博客",
  [PATHS.ADMIN_SNIPPET]: "片段",
  [PATHS.ADMIN_SNIPPET_CREATE]: "创建片段",
  [PATHS.ADMIN_SNIPPET_EDIT]: "编辑片段",
  [PATHS.ADMIN_TAG]: "标签",
  [PATHS.ADMIN_NOTE]: "笔记",

  /** ************* AUTH ****************** */
  [PATHS.AUTH_SIGN_IN]: "登录",
  [PATHS.AUTH_SIGN_UP]: "注册",
};

export const PATH_DESCRIPTION_MAP: Record<string, string> = {
  /** ************* SITE ****************** */
  [PATHS.SITE_HOME]: "首页",
  [PATHS.SITE_BLOG]: "这里记录了我的想法、文章",
  [PATHS.SITE_SNIPPET]: "代码片段，零碎片段等",
  [PATHS.SITE_COMING]: "实验室，这里会有一些实验性的东西",
  [PATHS.AUTH_SIGN_UP]: "注册一个账号，加入我们",
  [PATHS.SITE_ABOUT]: `你有一份关于${NICKNAME}的简介`,
  [PATHS.SITE_MESSAGES]: "请留言，分享你的想法",

  /** ************* ADMIN ****************** */
  [PATHS.ADMIN_HOME]: "欢迎回来",
  [PATHS.ADMIN_STATISTIC]: "聚合本站的所有统计数据",
  [PATHS.ADMIN_BLOG]: `博客管理，在这里对 博客进行操作`,
  [PATHS.ADMIN_BLOG_CREATE]: "在这里尽情地创作",
  [PATHS.ADMIN_BLOG_EDIT]: "好的文章总是需要反复打磨的",
  [PATHS.ADMIN_SNIPPET]: `片段管理，在这里对片段进行操作`,
  [PATHS.ADMIN_SNIPPET_CREATE]: "Talk is cheap. Show me the code.",
  [PATHS.ADMIN_SNIPPET_EDIT]: "修修补补，总比没有好",
  [PATHS.ADMIN_TAG]: `标签管理，在这里对标签进行操作`,
  [PATHS.ADMIN_NOTE]: "好记性不如烂笔头",

  /** ************* AUTH ****************** */
  [PATHS.AUTH_SIGN_IN]: "登录",
};
