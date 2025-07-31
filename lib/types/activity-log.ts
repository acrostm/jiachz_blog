/**
 * 用户活动日志相关类型定义
 */
import {
  ActivityStatus,
  ActivityType,
  DeviceType,
  type UserActivityLog as PrismaUserActivityLog,
  ResourceType,
} from "@prisma/client";

// 基础活动日志数据
export interface ActivityLogData {
  userId: string;
  activityType: ActivityType;
  activityStatus: ActivityStatus;
  resourceType?: ResourceType;
  resourceId?: string;
  resourceTitle?: string;
  actionDetails?: Record<string, any>;
  metadata?: Record<string, any>;
  errorMessage?: string;
  errorCode?: string;
  sessionId?: string;
}

// 扩展的活动日志（包含数据库所有字段）
export interface UserActivityLog extends PrismaUserActivityLog {
  user?: {
    name: string | null;
    email: string | null;
  };
}

// 网络和设备信息
export interface NetworkDeviceInfo {
  ipAddress: string;
  userAgent: string;
  location?: string;
  country?: string;
  region?: string;
  city?: string;
  countryCode?: string;
  browserName?: string;
  browserVersion?: string;
  operatingSystem?: string;
  deviceType: DeviceType;
  deviceFingerprint?: string;
}

// 安全分析结果
export interface SecurityAnalysis {
  isSuspicious: boolean;
  suspiciousReasons: string[];
  riskScore: number;
}

// 操作详情的标准结构
export interface ActionDetails {
  action: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changes?: string[];
  description?: string;
}

// 不同操作类型的元数据结构
export interface BlogMetadata {
  slug?: string;
  published?: boolean;
  tags?: string[];
  coverChanged?: boolean;
}

export interface NoteMetadata {
  published?: boolean;
  tags?: string[];
}

export interface MessageMetadata {
  messageLength?: number;
  isLogin?: boolean;
}

export interface AuthMetadata {
  loginMethod?: string;
  provider?: string;
  sessionDuration?: number;
}

export interface AdminMetadata {
  adminAction?: string;
  targetUserId?: string;
  configKey?: string;
  previousConfig?: Record<string, any>;
}

// 活动日志查询参数
export interface ActivityLogQueryParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  activityType?: ActivityType | "all";
  activityStatus?: ActivityStatus | "all";
  resourceType?: ResourceType | "all";
  isSuspicious?: boolean | "all";
  startDate?: string;
  endDate?: string;
  search?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
}

// 活动日志查询响应
export interface ActivityLogResponse {
  data: UserActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 活动统计数据
export interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  suspiciousActivities: number;
  failedActivities: number;
  activityTypeStats: Record<ActivityType, number>;
  hourlyStats: Array<{
    hour: number;
    count: number;
  }>;
}

// 操作类型分组
export const ACTIVITY_TYPE_GROUPS = {
  AUTH: ["REGISTER", "LOGIN", "LOGOUT", "PASSWORD_CHANGE"] as ActivityType[],
  CONTENT: [
    "BLOG_CREATE",
    "BLOG_UPDATE",
    "BLOG_DELETE",
    "BLOG_PUBLISH",
    "BLOG_UNPUBLISH",
    "NOTE_CREATE",
    "NOTE_UPDATE",
    "NOTE_DELETE",
    "NOTE_PUBLISH",
    "NOTE_UNPUBLISH",
  ] as ActivityType[],
  INTERACTION: ["MESSAGE_SEND", "MESSAGE_DELETE"] as ActivityType[],
  MANAGEMENT: ["TAG_CREATE", "TAG_UPDATE", "TAG_DELETE"] as ActivityType[],
  ADMIN: ["ADMIN_ACCESS", "USER_MANAGE", "SYSTEM_CONFIG"] as ActivityType[],
  FILE: ["FILE_UPLOAD", "FILE_DELETE"] as ActivityType[],
} as const;

// 活动类型显示名称
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  // 认证相关
  REGISTER: "用户注册",
  LOGIN: "用户登录",
  LOGOUT: "用户登出",
  SEND_OTP: "发送验证码",
  PASSWORD_CHANGE: "密码修改",

  // 博客相关
  BLOG_CREATE: "创建博客",
  BLOG_UPDATE: "更新博客",
  BLOG_DELETE: "删除博客",
  BLOG_PUBLISH: "发布博客",
  BLOG_UNPUBLISH: "取消发布博客",

  // 笔记相关
  NOTE_CREATE: "创建笔记",
  NOTE_UPDATE: "更新笔记",
  NOTE_DELETE: "删除笔记",
  NOTE_PUBLISH: "发布笔记",
  NOTE_UNPUBLISH: "取消发布笔记",

  // 留言板相关
  MESSAGE_SEND: "发送留言",
  MESSAGE_DELETE: "删除留言",

  // 标签相关
  TAG_CREATE: "创建标签",
  TAG_UPDATE: "更新标签",
  TAG_DELETE: "删除标签",

  // 管理相关
  ADMIN_ACCESS: "管理员访问",
  USER_MANAGE: "用户管理",
  SYSTEM_CONFIG: "系统配置",

  // 文件相关
  FILE_UPLOAD: "文件上传",
  FILE_DELETE: "文件删除",
};

// 活动状态显示名称
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  SUCCESS: "成功",
  FAILED: "失败",
  BLOCKED: "阻止",
  PENDING: "等待中",
};

// 资源类型显示名称
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  USER: "用户",
  BLOG: "博客",
  NOTE: "笔记",
  MESSAGE: "留言",
  TAG: "标签",
  FILE: "文件",
  SYSTEM: "系统",
};
