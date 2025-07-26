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

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";
import { AdminContentLayout } from "@/features/admin";

interface SuspiciousLogin {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  loginAt: string;
  loginStatus: string;
  loginMethod: string;
  ipAddress: string;
  location: string;
  country: string;
  region: string;
  city: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: string;
  isSuspicious: boolean;
  suspiciousReasons: string;
  riskScore: number;
  locationChanged: boolean;
  newDevice: boolean;
  previousLoginIp: string;
  previousLoginLocation: string;
  timeSinceLastLogin: number | null;
  createdAt: string;
}

interface SuspiciousLoginsResponse {
  suspiciousLogins: SuspiciousLogin[];
  total: number;
}

const fetchSuspiciousLogins = async (): Promise<SuspiciousLoginsResponse> => {
  const response = await fetch("/api/admin/suspicious-logins?limit=50");
  if (!response.ok) {
    throw new Error("Failed to fetch suspicious logins");
  }
  return response.json();
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

export default function SecurityMonitorPage() {
  const { data, loading, error } = useRequest(fetchSuspiciousLogins);

  const suspiciousLogins = data?.suspiciousLogins || [];
  const highRiskLogins = suspiciousLogins.filter(
    (login) => login.riskScore >= 70,
  );
  const mediumRiskLogins = suspiciousLogins.filter(
    (login) => login.riskScore >= 40 && login.riskScore < 70,
  );

  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[
            PATHS.ADMIN_HOME,
            { label: "安全监控", href: "/admin/security" },
          ]}
        />
      }
    >
      <div className="space-y-6">
        {/* 概览统计 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {highRiskLogins.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    高风险登录
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {mediumRiskLogins.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    中风险登录
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {suspiciousLogins.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    总可疑登录
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 可疑登录列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5" />
              <span>可疑登录监控</span>
              <Badge variant="outline">{suspiciousLogins.length} 条记录</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                加载中...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">加载失败</div>
            ) : suspiciousLogins.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                暂无可疑登录记录
              </div>
            ) : (
              <div className="space-y-4">
                {suspiciousLogins.map((login) => (
                  <div
                    key={login.id}
                    className="rounded-lg border border-red-200 bg-red-50/50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(login.deviceType)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {login.userName || login.userEmail}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {login.userEmail}
                            </Badge>
                            {getLoginMethodBadge(login.loginMethod)}
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <ShieldAlert className="size-3" />
                              <span>风险: {login.riskScore}</span>
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {formatRelativeTime(login.loginAt)} ·{" "}
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

                    <div className="mt-3 border-t border-red-200 pt-3">
                      <div className="mb-2 text-sm text-red-600">
                        可疑原因:{" "}
                        {JSON.parse(login.suspiciousReasons || "[]").join("、")}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {login.locationChanged && (
                          <Badge variant="outline" className="text-xs">
                            地点变更: {login.previousLoginLocation} →{" "}
                            {login.location}
                          </Badge>
                        )}
                        {login.newDevice && (
                          <Badge variant="outline" className="text-xs">
                            新设备登录
                          </Badge>
                        )}
                        {login.previousLoginIp &&
                          login.previousLoginIp !== login.ipAddress && (
                            <Badge variant="outline" className="text-xs">
                              IP变更: {login.previousLoginIp} →{" "}
                              {login.ipAddress}
                            </Badge>
                          )}
                        {login.timeSinceLastLogin && (
                          <Badge variant="outline" className="text-xs">
                            距离上次登录:{" "}
                            {Math.floor(login.timeSinceLastLogin / 60)}小时
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminContentLayout>
  );
}
