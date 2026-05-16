import { NICKNAME } from ".";

export const PATHS = {
  /** ************* SITE ****************** */
  SITE_HOME: "/",
  SITE_BLOG: "/blog",
  SITE_NEWS: "/news",
  SITE_ABOUT: "/about",
  SITE_COMING: "/coming-soon",
  SITE_MESSAGES: "/messages",
  SITE_PROFILE: "/admin/profile",
  SITE_USERS: "/admin/user",
  SITEMAP: "/sitemap.xml",

  /** ************* ADMIN ****************** */
  ADMIN_HOME: "/admin",
  ADMIN_STATISTIC: "/admin/statistic",

  ADMIN_BLOG: "/admin/blog",
  ADMIN_BLOG_CREATE: "/admin/blog/create",
  ADMIN_BLOG_EDIT: "/admin/blog/edit",

  ADMIN_TAG: "/admin/tag",
  ADMIN_NOTE: "/admin/note",
  ADMIN_USER: "/admin/user",
  ADMIN_SECURITY: "/admin/security",
  ADMIN_ACTIVITY_LOGS: "/admin/activity-logs",
  ADMIN_BARK_CONFIG: "/admin/settings/bark",

  /** ************* AUTH ****************** */
  AUTH_SIGN_IN: "/auth/sign_in",
  AUTH_SIGN_UP: "/auth/sign_up",
  NEXT_AUTH_SIGN_IN: "/api/auth/sign_in",
};

export const PATHS_MAP: Record<string, string> = {
  /** ************* SITE ****************** */
  [PATHS.SITE_HOME]: "首页",
  [PATHS.SITE_BLOG]: "博客",
  [PATHS.SITE_NEWS]: "News",
  [PATHS.SITE_COMING]: "即将上线",
  [PATHS.SITE_MESSAGES]: "留言",
  [PATHS.SITE_PROFILE]: "个人资料",
  [PATHS.SITE_USERS]: "用户管理",
  [PATHS.SITE_ABOUT]: "关于",
  [PATHS.SITEMAP]: "站点地图",

  /** ************* ADMIN ****************** */
  [PATHS.ADMIN_HOME]: "首页",
  [PATHS.ADMIN_STATISTIC]: "统计",
  [PATHS.ADMIN_BLOG]: "博客",
  [PATHS.ADMIN_BLOG_CREATE]: "创建博客",
  [PATHS.ADMIN_BLOG_EDIT]: "编辑博客",
  [PATHS.ADMIN_TAG]: "标签",
  [PATHS.ADMIN_NOTE]: "笔记",
  [PATHS.ADMIN_USER]: "用户管理",
  [PATHS.ADMIN_SECURITY]: "安全监控",
  [PATHS.ADMIN_ACTIVITY_LOGS]: "操作日志",
  [PATHS.ADMIN_BARK_CONFIG]: "Bark通知配置",

  /** ************* AUTH ****************** */
  [PATHS.AUTH_SIGN_IN]: "登录",
  [PATHS.AUTH_SIGN_UP]: "注册",
};

export const PATH_DESCRIPTION_MAP: Record<string, string> = {
  /** ************* SITE ****************** */
  [PATHS.SITE_HOME]: "首页",
  [PATHS.SITE_BLOG]: "这里记录了我的想法、文章",
  [PATHS.SITE_NEWS]: "聚合实时热榜、技术社区和开源趋势",
  [PATHS.SITE_COMING]: "功能正在准备中",
  [PATHS.AUTH_SIGN_UP]: "注册一个账号，加入我们",
  [PATHS.SITE_ABOUT]: `你有一份关于${NICKNAME}的简介`,
  [PATHS.SITE_MESSAGES]: "请留言，分享你的想法",

  /** ************* ADMIN ****************** */
  [PATHS.ADMIN_HOME]: "欢迎回来",
  [PATHS.ADMIN_STATISTIC]: "聚合本站的所有统计数据",
  [PATHS.ADMIN_BLOG]: `博客管理，在这里对 博客进行操作`,
  [PATHS.ADMIN_BLOG_CREATE]: "在这里尽情地创作",
  [PATHS.ADMIN_BLOG_EDIT]: "好的文章总是需要反复打磨的",
  [PATHS.ADMIN_TAG]: `标签管理，在这里对标签进行操作`,
  [PATHS.ADMIN_NOTE]: "好记性不如烂笔头",
  [PATHS.ADMIN_USER]: "管理所有用户",
  [PATHS.ADMIN_SECURITY]: "查看可疑登录和安全风险",
  [PATHS.ADMIN_ACTIVITY_LOGS]:
    "查看和管理所有用户操作活动记录，包括登录、内容管理等",
  [PATHS.ADMIN_BARK_CONFIG]: "配置Bark通知服务，管理通知推送设置、音效、图标等",

  /** ************* AUTH ****************** */
  [PATHS.AUTH_SIGN_IN]: "登录",
};
