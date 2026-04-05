"use client";

import React, { useState } from "react";

import { useRequest } from "ahooks";
import {
  Calendar,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPin,
  Monitor,
  ShieldAlert,
  Smartphone,
  Tablet,
  Wifi,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { formatRelativeTime } from "@/lib/utils";

import type { UserActivityLog } from "@/lib/types/activity-log";

// API响应类型
interface LoginHistoryResponse {
  data: UserActivityLog[];
  total: number;
}

const fetchLoginHistory = async (): Promise<LoginHistoryResponse> => {
  // 使用新的活动日志API获取登录历史
  const response = await fetch(
    "/api/admin/activity-logs?activityType=LOGIN&pageSize=10",
  );
  if (!response.ok) {
    throw new Error("Failed to fetch login history");
  }
  return response.json() as Promise<{ data: UserActivityLog[] }>;
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

  const config = variants[status as keyof typeof variants] ?? variants.SUCCESS;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getLoginMethodLabel = (metadata: string | null) => {
  if (!metadata) return "未知";

  try {
    const data = JSON.parse(metadata) as { loginMethod?: string };
    const method = data.loginMethod;

    const labels: Record<string, string> = {
      CREDENTIALS: "密码登录",
      OAUTH_GITHUB: "GitHub",
      OAUTH_GOOGLE: "Google",
      OTP: "验证码",
    };

    return labels[method ?? ""] ?? method ?? "未知";
  } catch {
    return "未知";
  }
};

export function LoginHistory() {
  const { data, loading, error } = useRequest(fetchLoginHistory);
  const loginHistory = data?.data ?? [];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          登录历史
          {isOpen ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" />
              <span>登录历史</span>
              <Badge variant="outline">{loginHistory.length} 条记录</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                加载中...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">加载失败</div>
            ) : loginHistory.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                暂无登录记录
              </div>
            ) : (
              <div className="space-y-4">
                {loginHistory.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(log.deviceType)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatRelativeTime(log.timestamp)}
                          </span>
                          {getStatusBadge(log.activityStatus)}
                          <Badge variant="outline" className="text-xs">
                            {getLoginMethodLabel(log.metadata)}
                          </Badge>
                          {log.isSuspicious && (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <ShieldAlert className="size-3" />
                              <span>风险: {log.riskScore}</span>
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {log.browserName} {log.browserVersion} ·{" "}
                          {log.operatingSystem}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Wifi className="size-3" />
                        <span className="font-mono">{log.ipAddress}</span>
                      </div>
                      {log.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          <span>{log.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loginHistory.length >= 10 && (
                  <div className="pt-2 text-center">
                    <Badge variant="outline" className="text-xs">
                      显示最近 10 次登录记录
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
