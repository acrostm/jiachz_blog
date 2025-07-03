"use client";

import React, { useEffect, useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";
import { AdminContentLayout } from "@/features/admin/components/layout/admin-content-layout";

interface Account {
  provider: string;
  providerAccountId: string;
}

interface User {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  image?: string;
  accounts: Account[];
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  function formatLocalTime(dateStr?: string) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    // yyyy年MM月dd日 HH:mm:ss
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  }

  function formatRelativeTime(dateStr?: string) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60 * 1000) return "刚刚";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 30 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 3600000))}天前`;
    if (diff < 30 * 24 * 60 * 60 * 1000 * 7) return `${Math.floor(diff / (24 * 3600000 * 7))}周前`;
    if (diff < 365 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 3600000 * 30))}月前`;

    return formatLocalTime(dateStr);
  }

  const columns = [
    {
      accessorKey: "image",
      header: "头像",
      cell: ({ row }: any) => (
        <Avatar className="size-8">
          <img src={row.original.image || undefined} alt="avatar" />
        </Avatar>
      ),
    },
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "昵称" },
    { accessorKey: "email", header: "邮箱" },
    {
      accessorKey: "password",
      header: "密码",
      cell: ({ row }: any) => {
        const [show, setShow] = useState(false);
        const pw = row.original.password || "";
        return (
          <span
            className="group relative inline-flex cursor-pointer items-center"
            onClick={() => setShow((v) => !v)}
          >
            <span
              className={`absolute left-0 top-0 w-full transition-opacity duration-200 ${show ? "opacity-0" : "opacity-100"}`}
              style={{ pointerEvents: show ? "none" : "auto" }}
            >
              {pw ? "•".repeat(8) : ""}
            </span>
            <span
              className={`transition-opacity duration-200 ${show ? "opacity-100" : "opacity-0"}`}
              style={{
                pointerEvents: show ? "auto" : "none",
                position: "relative",
              }}
            >
              {pw}
            </span>
            <span className="ml-2 text-muted-foreground">
              {show ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </span>
          </span>
        );
      },
    },
    {
      accessorKey: "accounts",
      header: "账号绑定",
      cell: ({ row }: any) => (
        <div className="flex flex-wrap gap-2">
          {row.original.accounts?.length ? (
            row.original.accounts.map((acc: Account) => (
              <Badge key={acc.provider + acc.providerAccountId}>
                {acc.provider}: {acc.providerAccountId}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">无</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "注册时间",
      cell: ({ row }: any) => formatLocalTime(row.original.createdAt),
    },
    {
      accessorKey: "lastLoginAt",
      header: "最后登录",
      cell: ({ row }: any) => formatRelativeTime(row.original.lastLoginAt),
    },
  ];

  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb breadcrumbList={[PATHS.ADMIN_HOME, PATHS.ADMIN_USER]} />
      }
    >
      <Card className="p-4">
        <h2 className="mb-4 text-xl font-bold">用户管理</h2>
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          params={{ pageIndex: 1, pageSize: 100 }}
          updateParams={() => {}}
        />
      </Card>
    </AdminContentLayout>
  );
}
