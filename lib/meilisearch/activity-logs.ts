/**
 * Meilisearch 活动日志搜索配置
 * 预留配置，用于未来实现活动日志的全文搜索功能
 */

// 活动日志搜索索引配置
export const ACTIVITY_LOGS_INDEX_CONFIG = {
  // 索引名称
  indexName: "activity_logs",

  // 主键字段
  primaryKey: "id",

  // 可搜索字段配置
  searchableAttributes: [
    "activityType",
    "resourceTitle",
    "actionDetails",
    "metadata",
    "user.name",
    "user.email",
    "ipAddress",
    "location",
    "browserName",
    "operatingSystem",
    "errorMessage",
  ],

  // 可筛选字段配置
  filterableAttributes: [
    "userId",
    "activityType",
    "activityStatus",
    "resourceType",
    "resourceId",
    "isSuspicious",
    "riskScore",
    "deviceType",
    "timestamp",
    "createdAt",
    "country",
    "countryCode",
  ],

  // 可排序字段配置
  sortableAttributes: [
    "timestamp",
    "createdAt",
    "riskScore",
    "activityType",
    "activityStatus",
  ],

  // 字段显示权重配置
  rankingRules: [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
    "timestamp:desc", // 默认按时间倒序
  ],

  // 同义词配置（用于搜索优化）
  synonyms: {
    登录: ["login", "sign_in", "登入"],
    注册: ["register", "sign_up", "注册"],
    博客: ["blog", "文章", "post"],
    笔记: ["note", "备忘"],
    留言: ["message", "评论", "comment"],
    管理员: ["admin", "administrator", "管理者"],
    失败: ["failed", "error", "错误"],
    成功: ["success", "successful", "完成"],
    可疑: ["suspicious", "异常", "风险"],
  },

  // 停用词配置（搜索时忽略的词汇）
  stopWords: [
    "的",
    "了",
    "是",
    "在",
    "有",
    "和",
    "就",
    "不",
    "人",
    "都",
    "一",
    "一个",
    "上",
    "也",
    "很",
    "到",
    "说",
    "要",
    "去",
    "你",
    "会",
    "着",
    "没有",
    "看",
    "好",
    "自己",
    "这样",
    "什么",
    "时候",
    "可以",
    "但是",
    "还是",
    "比较",
  ],

  // 分页配置
  pagination: {
    maxTotalHits: 10000, // 最大搜索结果数
    maxOffset: 1000, // 最大偏移量
  },
} as const;

// 搜索查询接口类型
export interface ActivityLogSearchQuery {
  query?: string; // 搜索关键词
  filters?: string; // 筛选条件
  sort?: string[]; // 排序规则
  limit?: number; // 返回结果数量
  offset?: number; // 偏移量
  facets?: string[]; // 分面统计字段
  highlightPreTag?: string; // 高亮前缀标签
  highlightPostTag?: string; // 高亮后缀标签
}

// 搜索结果接口类型
export interface ActivityLogSearchResult {
  hits: Array<{
    id: string;
    userId: string;
    activityType: string;
    activityStatus: string;
    resourceType?: string;
    resourceId?: string;
    resourceTitle?: string;
    timestamp: string;
    user?: {
      name: string | null;
      email: string | null;
    };
    ipAddress: string;
    location?: string;
    isSuspicious: boolean;
    riskScore: number;
    _formatted?: any; // 格式化后的搜索结果
    _matchesPosition?: any; // 匹配位置信息
  }>;
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

// 索引文档结构（用于同步到 Meilisearch）
export interface ActivityLogDocument {
  id: string;
  userId: string;
  activityType: string;
  activityStatus: string;
  resourceType?: string;
  resourceId?: string;
  resourceTitle?: string;
  timestamp: number; // Unix 时间戳，便于排序
  createdAt: number; // Unix 时间戳
  user: {
    name: string | null;
    email: string | null;
  };
  ipAddress: string;
  location?: string;
  country?: string;
  countryCode?: string;
  browserName?: string;
  operatingSystem?: string;
  deviceType: string;
  isSuspicious: boolean;
  riskScore: number;
  actionDetails?: string; // JSON 字符串
  metadata?: string; // JSON 字符串
  errorMessage?: string;
  searchableText: string; // 组合的可搜索文本字段
}

/**
 * 将数据库记录转换为 Meilisearch 文档格式
 */
export function transformToSearchDocument(
  activityLog: any,
): ActivityLogDocument {
  return {
    id: activityLog.id,
    userId: activityLog.userId,
    activityType: activityLog.activityType,
    activityStatus: activityLog.activityStatus,
    resourceType: activityLog.resourceType,
    resourceId: activityLog.resourceId,
    resourceTitle: activityLog.resourceTitle,
    timestamp: new Date(activityLog.timestamp).getTime(),
    createdAt: new Date(activityLog.createdAt).getTime(),
    user: {
      name: activityLog.user?.name || null,
      email: activityLog.user?.email || null,
    },
    ipAddress: activityLog.ipAddress,
    location: activityLog.location,
    country: activityLog.country,
    countryCode: activityLog.countryCode,
    browserName: activityLog.browserName,
    operatingSystem: activityLog.operatingSystem,
    deviceType: activityLog.deviceType,
    isSuspicious: activityLog.isSuspicious,
    riskScore: activityLog.riskScore,
    actionDetails: activityLog.actionDetails,
    metadata: activityLog.metadata,
    errorMessage: activityLog.errorMessage,
    // 创建组合搜索文本
    searchableText: [
      activityLog.activityType,
      activityLog.resourceTitle,
      activityLog.user?.name,
      activityLog.user?.email,
      activityLog.location,
      activityLog.browserName,
      activityLog.operatingSystem,
      activityLog.errorMessage,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

/**
 * 构建搜索筛选条件
 */
export function buildSearchFilters(params: {
  userId?: string;
  activityType?: string;
  activityStatus?: string;
  resourceType?: string;
  isSuspicious?: boolean;
  startTimestamp?: number;
  endTimestamp?: number;
  minRiskScore?: number;
  maxRiskScore?: number;
}): string {
  const filters: string[] = [];

  if (params.userId) {
    filters.push(`userId = "${params.userId}"`);
  }

  if (params.activityType && params.activityType !== "all") {
    filters.push(`activityType = "${params.activityType}"`);
  }

  if (params.activityStatus && params.activityStatus !== "all") {
    filters.push(`activityStatus = "${params.activityStatus}"`);
  }

  if (params.resourceType && params.resourceType !== "all") {
    filters.push(`resourceType = "${params.resourceType}"`);
  }

  if (params.isSuspicious !== undefined) {
    filters.push(`isSuspicious = ${params.isSuspicious}`);
  }

  if (params.startTimestamp) {
    filters.push(`timestamp >= ${params.startTimestamp}`);
  }

  if (params.endTimestamp) {
    filters.push(`timestamp <= ${params.endTimestamp}`);
  }

  if (params.minRiskScore !== undefined) {
    filters.push(`riskScore >= ${params.minRiskScore}`);
  }

  if (params.maxRiskScore !== undefined) {
    filters.push(`riskScore <= ${params.maxRiskScore}`);
  }

  return filters.join(" AND ");
}

// 预定义的常用搜索查询
export const PRESET_SEARCH_QUERIES = {
  // 可疑活动
  suspiciousActivities: {
    filters: "isSuspicious = true",
    sort: ["riskScore:desc", "timestamp:desc"],
  },

  // 失败的操作
  failedActivities: {
    filters: 'activityStatus = "FAILED"',
    sort: ["timestamp:desc"],
  },

  // 高风险操作
  highRiskActivities: {
    filters: "riskScore >= 50",
    sort: ["riskScore:desc", "timestamp:desc"],
  },

  // 管理员操作
  adminActivities: {
    filters: 'activityType IN ["ADMIN_ACCESS", "USER_MANAGE", "SYSTEM_CONFIG"]',
    sort: ["timestamp:desc"],
  },

  // 最近24小时的活动
  recentActivities: {
    filters: `timestamp >= ${Date.now() - 24 * 60 * 60 * 1000}`,
    sort: ["timestamp:desc"],
  },
} as const;
