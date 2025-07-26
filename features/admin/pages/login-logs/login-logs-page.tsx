"use client";

import React from "react";

import { type ColumnDef } from "@tanstack/react-table";
import { useRequest, useSetState } from "ahooks";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Calendar,
  Filter,
  MapPin,
  Monitor,
  Search,
  Shield,
  ShieldAlert,
  Smartphone,
  Tablet,
  User,
  Wifi,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";
import { AdminContentLayout } from "@/features/admin";

interface LoginLog {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  loginAt: string;
  loginStatus: "SUCCESS" | "FAILED" | "BLOCKED" | "SUSPICIOUS";
  loginMethod: "CREDENTIALS" | "OAUTH_GITHUB" | "OAUTH_GOOGLE" | "OTP";
  sessionId: string | null;
  ipAddress: string;
  location: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  countryCode: string | null;
  userAgent: string;
  browserName: string | null;
  browserVersion: string | null;
  operatingSystem: string | null;
  deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN";
  deviceFingerprint: string | null;
  isSuspicious: boolean;
  suspiciousReasons: string | null;
  riskScore: number;
  previousLoginIp: string | null;
  previousLoginLocation: string | null;
  timeSinceLastLogin: number | null;
  locationChanged: boolean;
  newDevice: boolean;
  failureReason: string | null;
  blockedReason: string | null;
  createdAt: string;
}

interface LoginLogsResponse {
  data: LoginLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface FilterParams {
  page: number;
  pageSize: number;
  loginStatus?: string;
  loginMethod?: string;
  isSuspicious?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

const fetchLoginLogs = async (
  params: FilterParams,
): Promise<LoginLogsResponse> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(
    `/api/admin/login-logs?${searchParams.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch login logs");
  }
  return response.json();
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

const getStatusBadge = (status: string) => {
  const variants = {
    SUCCESS: {
      variant: "default" as const,
      label: "成功",
      color: "text-green-600",
    },
    FAILED: {
      variant: "destructive" as const,
      label: "失败",
      color: "text-red-600",
    },
    BLOCKED: {
      variant: "destructive" as const,
      label: "阻止",
      color: "text-red-600",
    },
    SUSPICIOUS: {
      variant: "destructive" as const,
      label: "可疑",
      color: "text-yellow-600",
    },
  };

  const config = variants[status as keyof typeof variants] || variants.SUCCESS;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getMethodBadge = (method: string) => {
  const labels = {
    CREDENTIALS: "密码登录",
    OAUTH_GITHUB: "GitHub",
    OAUTH_GOOGLE: "Google",
    OTP: "验证码",
  };

  return (
    <Badge variant="outline">
      {labels[method as keyof typeof labels] || method}
    </Badge>
  );
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "MM-dd HH:mm", { locale: zhCN });
};

export const LoginLogsPage = () => {
  const [params, setParams] = useSetState<FilterParams>({
    page: 1,
    pageSize: 20,
  });

  const [filters, setFilters] = useSetState({
    loginStatus: "all",
    loginMethod: "all",
    isSuspicious: "all",
    search: "",
  });

  const { data, loading, refresh } = useRequest(
    () => fetchLoginLogs({ ...params, ...filters }),
    {
      refreshDeps: [params, filters],
      debounceWait: 300,
    },
  );

  const loginLogs = data?.data || [];
  const total = data?.total || 0;

  // 定义表格列
  const columns: ColumnDef<LoginLog>[] = [
    {
      id: "user",
      header: "用户",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{log.userName || "未知用户"}</div>
              <div className="text-xs text-muted-foreground">
                {log.userEmail}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "loginInfo",
      header: "登录信息",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="text-sm">{formatRelativeTime(log.loginAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(log.loginStatus)}
              {getMethodBadge(log.loginMethod)}
            </div>
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
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="flex items-center gap-2">
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
                        {log.suspiciousReasons
                          ? JSON.parse(log.suspiciousReasons).join("、")
                          : "未知原因"}
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
          </div>
        );
      },
    },
  ];

  const clearFilters = () => {
    setFilters({
      loginStatus: "all",
      loginMethod: "all",
      isSuspicious: "all",
      search: "",
    });
  };

  const hasActiveFilters = filters.search !== "" || 
    filters.loginStatus !== "all" || 
    filters.loginMethod !== "all" || 
    filters.isSuspicious !== "all";

  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[
            PATHS.ADMIN_HOME,
            { label: "登录日志", href: PATHS.ADMIN_LOGIN_LOGS },
          ]}
        />
      }
    >
      <div className="space-y-6">
        {/* 页面标题和统计 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">登录日志管理</h1>
            <p className="text-muted-foreground">
              查看和管理所有用户的登录活动记录
            </p>
          </div>
          <Button onClick={refresh} variant="outline">
            刷新数据
          </Button>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium">搜索用户</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    placeholder="用户名或邮箱"
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">登录状态</label>
                <Select
                  value={filters.loginStatus}
                  onValueChange={(value) => setFilters({ loginStatus: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="SUCCESS">成功</SelectItem>
                    <SelectItem value="FAILED">失败</SelectItem>
                    <SelectItem value="BLOCKED">阻止</SelectItem>
                    <SelectItem value="SUSPICIOUS">可疑</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">登录方式</label>
                <Select
                  value={filters.loginMethod}
                  onValueChange={(value) => setFilters({ loginMethod: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部方式</SelectItem>
                    <SelectItem value="CREDENTIALS">密码登录</SelectItem>
                    <SelectItem value="OAUTH_GITHUB">GitHub</SelectItem>
                    <SelectItem value="OAUTH_GOOGLE">Google</SelectItem>
                    <SelectItem value="OTP">验证码</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">安全状态</label>
                <Select
                  value={filters.isSuspicious}
                  onValueChange={(value) => setFilters({ isSuspicious: value })}
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
          data={loginLogs}
          loading={loading}
          total={total}
          params={{ pageIndex: params.page - 1, pageSize: params.pageSize }}
          updateParams={(newParams) =>
            setParams({
              page: newParams.pageIndex + 1,
              pageSize: newParams.pageSize,
            })
          }
          noResult={
            <div className="py-8 text-center">
              <Shield className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">暂无登录记录</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "没有符合筛选条件的记录"
                  : "还没有任何登录活动"}
              </p>
            </div>
          }
        />
      </div>
    </AdminContentLayout>
  );
};
