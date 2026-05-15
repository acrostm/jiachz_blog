"use client";

import React from "react";

import { type CellContext, type ColumnDef } from "@tanstack/react-table";
import { useRequest, useSetState } from "ahooks";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  MapPin,
  MessageSquare,
  Monitor,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  Tablet,
  Tag,
  Upload,
  User,
  Wifi,
  X,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";
import { AdminContentLayout } from "@/features/admin";
import type {
  ActivityLogQueryParams,
  ActivityLogResponse,
  UserActivityLog,
} from "@/lib/types/activity-log";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
  RESOURCE_TYPE_LABELS,
} from "@/lib/types/activity-log";
import { formatRelativeTime } from "@/lib/utils";

const fetchActivityLogs = async (
  params: ActivityLogQueryParams,
): Promise<ActivityLogResponse> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(
    `/api/admin/activity-logs?${searchParams.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch activity logs");
  }
  return (await response.json()) as ActivityLogResponse;
};

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType) {
    case "MOBILE":
      return <Smartphone className="size-4" />;
    case "TABLET":
      return <Tablet className="size-4" />;
    case "DESKTOP":
      return <Monitor className="size-4" />;
    default:
      return <Monitor className="size-4" />;
  }
};

const getActivityTypeIcon = (activityType: string) => {
  if (activityType.startsWith("BLOG_") || activityType.startsWith("NOTE_")) {
    return <FileText className="size-4" />;
  }
  if (activityType.startsWith("MESSAGE_")) {
    return <MessageSquare className="size-4" />;
  }
  if (activityType.startsWith("TAG_")) {
    return <Tag className="size-4" />;
  }
  if (activityType.startsWith("ADMIN_") || activityType.startsWith("SYSTEM_")) {
    return <Settings className="size-4" />;
  }
  if (activityType.startsWith("FILE_")) {
    return <Upload className="size-4" />;
  }
  return <User className="size-4" />;
};

const getStatusBadge = (status: string) => {
  const variants = {
    SUCCESS: {
      variant: "default" as const,
      label: "成功",
      icon: <CheckCircle className="size-3" />,
    },
    FAILED: {
      variant: "destructive" as const,
      label: "失败",
      icon: <XCircle className="size-3" />,
    },
    BLOCKED: {
      variant: "destructive" as const,
      label: "阻止",
      icon: <XCircle className="size-3" />,
    },
    PENDING: {
      variant: "secondary" as const,
      label: "等待中",
      icon: <Clock className="size-3" />,
    },
  };

  const config = variants[status as keyof typeof variants] || variants.SUCCESS;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};

type JsonObject = Record<string, unknown>;

const parseJsonObject = (value?: string | null): JsonObject | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : null;
  } catch {
    return null;
  }
};

const parseJsonValue = (value?: string | null): unknown => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const getStringValue = (
  obj: JsonObject | null,
  key: string,
): string | undefined => {
  const value = obj?.[key];
  return typeof value === "string" ? value : undefined;
};

const getNumberValue = (
  obj: JsonObject | null,
  key: string,
): number | undefined => {
  const value = obj?.[key];
  return typeof value === "number" ? value : undefined;
};

const getBooleanValue = (
  obj: JsonObject | null,
  key: string,
): boolean | undefined => {
  const value = obj?.[key];
  return typeof value === "boolean" ? value : undefined;
};

const getObjectValue = (
  obj: JsonObject | null,
  key: string,
): JsonObject | undefined => {
  const value = obj?.[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
};

const getStringArrayValue = (obj: JsonObject | null, key: string): string[] => {
  const value = obj?.[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
};

const formatSuspiciousReasons = (value?: string | null): string => {
  const parsed = parseJsonValue(value);
  return Array.isArray(parsed) && parsed.length > 0
    ? parsed.map(String).join("、")
    : "未知原因";
};

const JsonDetails = ({ title, raw }: { title: string; raw: string }) => {
  const parsed = parseJsonValue(raw);
  const isRawString = typeof parsed === "string";

  return (
    <div>
      <h4 className="mb-2 font-medium">
        {isRawString ? `${title} (原始数据)` : title}
      </h4>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded border bg-muted p-3 text-sm">
        {isRawString ? parsed : JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  );
};

type ActivityLogFilters = {
  activityType: string;
  activityStatus: string;
  resourceType: string;
  isSuspicious: "all" | "true" | "false";
  search: string;
};

const toActivityLogQueryParams = (
  params: ActivityLogQueryParams,
  filters: ActivityLogFilters,
): ActivityLogQueryParams => ({
  ...params,
  activityType: filters.activityType as ActivityLogQueryParams["activityType"],
  activityStatus:
    filters.activityStatus as ActivityLogQueryParams["activityStatus"],
  resourceType: filters.resourceType as ActivityLogQueryParams["resourceType"],
  isSuspicious:
    filters.isSuspicious === "true"
      ? true
      : filters.isSuspicious === "false"
        ? false
        : "all",
  search: filters.search,
});

export const ActivityLogsPage = () => {
  const [params, setParams] = useSetState<ActivityLogQueryParams>({
    page: 1,
    pageSize: 20,
  });

  const [filters, setFilters] = useSetState<ActivityLogFilters>({
    activityType: "all",
    activityStatus: "all",
    resourceType: "all",
    isSuspicious: "all",
    search: "",
  });

  const { data, loading, refresh } = useRequest(
    () => fetchActivityLogs(toActivityLogQueryParams(params, filters)),
    {
      refreshDeps: [params, filters],
      debounceWait: 300,
    },
  );

  const activityLogs = data?.data ?? [];
  const total = data?.total ?? 0;

  // 定义表格列
  const columns: ColumnDef<UserActivityLog>[] = [
    {
      id: "user",
      header: "用户",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{log.user?.name ?? "未知用户"}</div>
              <div className="text-xs text-muted-foreground">
                {log.user?.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "activity",
      header: "活动信息",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="text-sm">
                {formatRelativeTime(log.timestamp)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getActivityTypeIcon(log.activityType)}
              <span className="text-sm font-medium">
                {ACTIVITY_TYPE_LABELS[log.activityType]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(log.activityStatus)}
              {log.resourceType && (
                <Badge variant="outline" className="text-xs">
                  {RESOURCE_TYPE_LABELS[log.resourceType]}
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "resource",
      header: "资源/详情",
      cell: ({ row }) => {
        const log = row.original;
        const actionDetails = parseJsonObject(log.actionDetails);
        const metadata = parseJsonObject(log.metadata);
        const loginMethod = getStringValue(metadata, "loginMethod");
        const changes = getStringArrayValue(actionDetails, "changes");
        const action = getStringValue(actionDetails, "action");
        const newValue = getObjectValue(actionDetails, "newValue");

        return (
          <div className="space-y-1">
            {/* 资源标题 - 优先显示 */}
            {log.resourceTitle && (
              <div className="max-w-48 truncate text-sm font-medium">
                {log.resourceTitle}
              </div>
            )}

            {/* 登录方式（对于登录操作） */}
            {log.activityType === "LOGIN" && loginMethod && (
              <Badge variant="outline" className="text-xs">
                {loginMethod === "CREDENTIALS"
                  ? "密码登录"
                  : loginMethod === "OAUTH_GITHUB"
                    ? "GitHub"
                    : loginMethod === "OAUTH_GOOGLE"
                      ? "Google"
                      : loginMethod}
              </Badge>
            )}

            {/* 变更摘要（对于更新操作） */}
            {changes.length > 0 && (
              <div className="text-xs text-muted-foreground">
                修改: {changes.join("、")}
              </div>
            )}

            {/* 新建项目数量（对于创建操作） */}
            {action === "create" && newValue && (
              <div className="text-xs text-muted-foreground">
                {Object.entries(newValue)
                  .map(([key, value]) => {
                    if (key === "tags" && typeof value === "number") {
                      return `${value}个标签`;
                    }
                    return null;
                  })
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}

            {/* 错误信息 */}
            {log.errorMessage && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="mr-1 size-3" />
                {log.errorMessage}
              </Badge>
            )}

            {/* 详细操作信息（点击查看） */}
            {Boolean(log.actionDetails ?? log.metadata) && (
              <Dialog>
                <DialogTrigger asChild>
                  <Badge
                    variant="outline"
                    className="cursor-pointer text-xs hover:bg-muted"
                  >
                    <Activity className="mr-1 size-3" />
                    详情
                  </Badge>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>操作详细信息</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* 基本信息 */}
                    <div>
                      <h4 className="mb-2 font-medium">基本信息</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          操作类型: {ACTIVITY_TYPE_LABELS[log.activityType]}
                        </div>
                        <div>
                          操作状态: {ACTIVITY_STATUS_LABELS[log.activityStatus]}
                        </div>
                        <div>时间: {formatRelativeTime(log.timestamp)}</div>
                        <div>用户: {log.user?.name ?? "未知用户"}</div>
                      </div>
                    </div>

                    {/* 操作详情 */}
                    {log.actionDetails && (
                      <JsonDetails title="操作详情" raw={log.actionDetails} />
                    )}

                    {/* 元数据 */}
                    {log.metadata && (
                      <JsonDetails title="元数据" raw={log.metadata} />
                    )}

                    {/* 设备和网络信息 */}
                    <div>
                      <h4 className="mb-2 font-medium">设备和网络信息</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>IP地址: {log.ipAddress}</div>
                        <div>位置: {log.location ?? "未知"}</div>
                        <div>设备类型: {log.deviceType}</div>
                        <div>操作系统: {log.operatingSystem}</div>
                        <div>
                          浏览器: {log.browserName} {log.browserVersion}
                        </div>
                        {log.sessionId && <div>会话ID: {log.sessionId}</div>}
                      </div>
                    </div>

                    {/* 安全信息 */}
                    {(log.isSuspicious || log.errorMessage) && (
                      <div>
                        <h4 className="mb-2 font-medium">安全信息</h4>
                        <div className="space-y-2 text-sm">
                          {log.isSuspicious && (
                            <div className="text-red-600">
                              风险评分: {log.riskScore} -
                              {formatSuspiciousReasons(log.suspiciousReasons)}
                            </div>
                          )}
                          {log.errorMessage && (
                            <div className="text-red-600">
                              错误信息: {log.errorMessage}
                              {log.errorCode && ` (错误代码: ${log.errorCode})`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        );
      },
    },
    {
      id: "device",
      header: "设备",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="flex items-center gap-2">
            {getDeviceIcon(log.deviceType)}
            <div>
              <div className="text-sm">
                {log.browserName} {log.browserVersion}
              </div>
              <div className="text-xs text-muted-foreground">
                {log.operatingSystem}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "location",
      header: "位置",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Wifi className="size-3 text-muted-foreground" />
              <span className="font-mono text-sm">{log.ipAddress}</span>
            </div>
            {log.location && (
              <div className="flex items-center gap-1">
                <MapPin className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {log.location}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "security",
      header: "安全",
      cell: ({ row }: CellContext<UserActivityLog, unknown>) => {
        const log: UserActivityLog = row.original;

        return (
          <div className="flex items-center gap-2">
            <>
              {log.isSuspicious ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1"
                      >
                        <ShieldAlert className="size-3" />
                        <span>风险: {log.riskScore}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-medium">可疑原因:</p>
                        <p className="text-sm">
                          {formatSuspiciousReasons(log.suspiciousReasons)}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="size-3" />
                  <span>正常</span>
                </Badge>
              )}
            </>

            {/* 错误信息对所有操作都显示 */}
            {log.errorMessage && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <AlertCircle className="size-3" />
                      <span>错误</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="font-medium">错误信息:</p>
                      <p className="text-sm">{log.errorMessage}</p>
                      {log.errorCode && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          错误代码: {log.errorCode}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      id: "additional",
      header: "相关信息",
      cell: ({ row }) => {
        const log = row.original;
        const metadata = parseJsonObject(log.metadata);
        const sessionDuration = getNumberValue(metadata, "sessionDuration");
        const published = getBooleanValue(metadata, "published");
        const tags = metadata?.tags;
        const tagCount = Array.isArray(tags) ? tags.length : undefined;
        const fileSize = getNumberValue(metadata, "fileSize");

        return (
          <div className="space-y-1">
            {/* 会话ID（如果有） */}
            {log.sessionId && (
              <div className="flex items-center gap-1">
                <User className="size-3 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">
                  会话: {log.sessionId.slice(0, 8)}...
                </span>
              </div>
            )}

            {/* 对于登录操作，显示会话持续时间 */}
            {log.activityType === "LOGIN" && sessionDuration !== undefined ? (
              <div className="text-xs text-muted-foreground">
                会话时长: {Math.round(sessionDuration / 60)}分钟
              </div>
            ) : null}

            {/* 对于博客操作，显示是否发布 */}
            {log.activityType.startsWith("BLOG_") && published !== undefined ? (
              <Badge
                variant={published ? "default" : "secondary"}
                className="text-xs"
              >
                {published ? "已发布" : "草稿"}
              </Badge>
            ) : null}

            {/* 对于标签操作，显示标签数量 */}
            {(log.activityType.startsWith("BLOG_") ||
              log.activityType.startsWith("NOTE_")) &&
            tagCount !== undefined ? (
              <div className="text-xs text-muted-foreground">
                标签: {tagCount}个
              </div>
            ) : null}

            {/* 对于文件操作，显示文件大小 */}
            {log.activityType.startsWith("FILE_") && fileSize !== undefined ? (
              <div className="text-xs text-muted-foreground">
                大小: {(fileSize / 1024).toFixed(1)}KB
              </div>
            ) : null}

            {/* 如果都没有，显示风险评分（如果有风险） */}
            {!log.sessionId && !metadata && log.riskScore > 0 && (
              <div className="text-xs text-muted-foreground">
                风险: {log.riskScore}
              </div>
            )}

            {/* 完全没有信息时显示 - */}
            {!log.sessionId && !metadata && log.riskScore === 0 && (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
  ];

  const clearFilters = () => {
    setFilters({
      activityType: "all",
      activityStatus: "all",
      resourceType: "all",
      isSuspicious: "all",
      search: "",
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.activityType !== "all" ||
    filters.activityStatus !== "all" ||
    filters.resourceType !== "all" ||
    filters.isSuspicious !== "all";

  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[PATHS.ADMIN_HOME, PATHS.ADMIN_ACTIVITY_LOGS]}
        />
      }
    >
      <div className="space-y-6">
        {/* 页面标题和统计 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">用户操作日志</h1>
            <p className="text-muted-foreground">
              查看和管理所有用户的操作活动记录，包括登录、内容管理、系统操作等
            </p>
          </div>
          <div className="flex gap-2">
            {/* Meilisearch 智能搜索预留位置 */}
            <div className="relative">
              <Input
                placeholder="智能搜索：支持用户名、操作类型、IP地址等（即将上线）"
                className="w-80 pr-10"
                disabled
              />
              <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
            </div>
            <Button onClick={refresh} variant="outline">
              刷新数据
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="size-5" />
              <span>筛选条件</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-2"
                >
                  <X className="mr-1 size-4" />
                  清除
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="text-sm font-medium">搜索</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    placeholder="用户名、邮箱、资源标题"
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">活动类型</label>
                <Select
                  value={filters.activityType}
                  onValueChange={(value) => setFilters({ activityType: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="LOGIN">登录</SelectItem>
                    <SelectItem value="REGISTER">注册</SelectItem>
                    <SelectItem value="BLOG_CREATE">创建博客</SelectItem>
                    <SelectItem value="BLOG_UPDATE">更新博客</SelectItem>
                    <SelectItem value="BLOG_DELETE">删除博客</SelectItem>
                    <SelectItem value="NOTE_CREATE">创建笔记</SelectItem>
                    <SelectItem value="NOTE_UPDATE">更新笔记</SelectItem>
                    <SelectItem value="MESSAGE_SEND">发送留言</SelectItem>
                    <SelectItem value="ADMIN_ACCESS">管理员访问</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">状态</label>
                <Select
                  value={filters.activityStatus}
                  onValueChange={(value) =>
                    setFilters({ activityStatus: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="SUCCESS">成功</SelectItem>
                    <SelectItem value="FAILED">失败</SelectItem>
                    <SelectItem value="BLOCKED">阻止</SelectItem>
                    <SelectItem value="PENDING">等待中</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">资源类型</label>
                <Select
                  value={filters.resourceType}
                  onValueChange={(value) => setFilters({ resourceType: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择资源" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部资源</SelectItem>
                    <SelectItem value="USER">用户</SelectItem>
                    <SelectItem value="BLOG">博客</SelectItem>
                    <SelectItem value="NOTE">笔记</SelectItem>
                    <SelectItem value="MESSAGE">留言</SelectItem>
                    <SelectItem value="TAG">标签</SelectItem>
                    <SelectItem value="FILE">文件</SelectItem>
                    <SelectItem value="SYSTEM">系统</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">安全状态</label>
                <Select
                  value={filters.isSuspicious}
                  onValueChange={(value) =>
                    setFilters({
                      isSuspicious: value as ActivityLogFilters["isSuspicious"],
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="false">正常</SelectItem>
                    <SelectItem value="true">可疑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns}
          data={activityLogs}
          loading={loading}
          total={total}
          params={{
            pageIndex: params.page ?? 1,
            pageSize: params.pageSize ?? 20,
          }}
          updateParams={(newParams) => {
            if (!newParams || typeof newParams === "function") {
              return;
            }

            const paginationParams = newParams as Partial<{
              pageIndex: number;
              pageSize: number;
            }>;

            setParams({
              page: Math.max(1, paginationParams.pageIndex ?? params.page ?? 1),
              pageSize: Math.max(
                1,
                paginationParams.pageSize ?? params.pageSize ?? 20,
              ),
            });
          }}
          noResult={
            <div className="py-8 text-center">
              <Activity className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">暂无操作记录</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "没有符合筛选条件的记录"
                  : "还没有任何操作活动"}
              </p>
            </div>
          }
        />
      </div>
    </AdminContentLayout>
  );
};
