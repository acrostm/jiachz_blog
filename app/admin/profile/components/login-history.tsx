"use client";

import React from "react";

import { useRequest } from "ahooks";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  AlertTriangle,
  MapPin,
  Monitor,
  Shield,
  ShieldAlert,
  Smartphone,
  Tablet,
  Wifi,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginActivity {
  id: string;
  loginAt: string;
  loginStatus: string;
  loginMethod: string;
  ipAddress: string;
  location: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: string;
  isSuspicious: boolean;
  suspiciousReasons: string;
  riskScore: number;
  locationChanged: boolean;
  newDevice: boolean;
  timeSinceLastLogin: number | null;
}

interface LoginHistoryResponse {
  loginHistory: LoginActivity[];
  total: number;
}

const fetchLoginHistory = async (): Promise<LoginHistoryResponse> => {
  const response = await fetch("/api/auth/login-history?limit=10");
  if (!response.ok) {
    throw new Error("Failed to fetch login history");
  }
  const data = (await response.json()) as LoginHistoryResponse;
  return data;
};

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType.toLowerCase()) {
    case "mobile":
      return <Smartphone className="size-4" />;
    case "tablet":
      return <Tablet className="size-4" />;
    case "desktop":
      return <Monitor className="size-4" />;
    default:
      return <Monitor className="size-4" />;
  }
};

const getLoginMethodBadge = (method: string) => {
  const variants = {
    CREDENTIALS: "default",
    OAUTH_GITHUB: "secondary",
    OAUTH_GOOGLE: "secondary",
    OTP: "outline",
  } as const;

  const labels = {
    CREDENTIALS: "密码登录",
    OAUTH_GITHUB: "GitHub",
    OAUTH_GOOGLE: "Google",
    OTP: "验证码",
  } as const;

  return (
    <Badge variant={variants[method as keyof typeof variants] || "default"}>
      {labels[method as keyof typeof labels] || method}
    </Badge>
  );
};

// const getRiskLevelColor = (riskScore: number) => {
//   if (riskScore >= 70) return "text-red-600";
//   if (riskScore >= 40) return "text-yellow-600";
//   return "text-green-600";
// };

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}小时前`;
  } else {
    return format(date, "MM月dd日 HH:mm", { locale: zhCN });
  }
};

export const LoginHistory = () => {
  const { data, loading, error } = useRequest(fetchLoginHistory);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            <span>登录历史</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            <span>登录历史</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">加载失败</div>
        </CardContent>
      </Card>
    );
  }

  const loginHistory = data?.loginHistory ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          <span>登录历史</span>
          <Badge variant="outline">{loginHistory.length} 条记录</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loginHistory.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            暂无登录记录
          </div>
        ) : (
          <div className="space-y-3">
            {loginHistory.map((login) => (
              <div
                key={login.id}
                className={`rounded-lg border p-4 transition-colors ${
                  login.isSuspicious
                    ? "border-red-200 bg-red-50/50"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(login.deviceType)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatRelativeTime(login.loginAt)}
                        </span>
                        {getLoginMethodBadge(login.loginMethod)}
                        {login.isSuspicious && (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <ShieldAlert className="size-3" />
                            <span>可疑登录</span>
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {login.browserName} {login.browserVersion} ·{" "}
                        {login.operatingSystem}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Wifi className="size-3" />
                      <span>{login.ipAddress}</span>
                    </div>
                    {login.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3" />
                        <span>{login.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {login.isSuspicious && (
                  <div className="mt-3 border-t border-red-200 pt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="size-4 text-red-600" />
                      <span className="font-medium text-red-600">
                        风险评分: {login.riskScore}/100
                      </span>
                    </div>
                    {login.suspiciousReasons && (
                      <div className="mt-1 text-sm text-red-600">
                        {(JSON.parse(login.suspiciousReasons) as string[]).join(
                          "、",
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {login.locationChanged && (
                        <Badge variant="outline" className="text-xs">
                          地点变更
                        </Badge>
                      )}
                      {login.newDevice && (
                        <Badge variant="outline" className="text-xs">
                          新设备
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
