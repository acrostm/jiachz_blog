"use client";

import React, { useEffect, useState } from "react";

import { type Row } from "@tanstack/react-table";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";
import { AdminContentLayout } from "@/features/admin/components/layout/admin-content-layout";
import { formatRelativeTime } from "@/lib/utils";

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

interface UsersApiResponse {
  users: User[];
}

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users");
        const data = (await res.json()) as UsersApiResponse;
        setUsers(data.users || []);
      } catch (err) {
        setUsers([]);
        // 可选：console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void loadUsers();
  }, []);

  function formatLocalTime(dateStr?: string) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    // yyyy年MM月dd日 HH:mm:ss
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  }

  function formatRelativeTimeLocal(dateStr?: string) {
    return formatRelativeTime(dateStr);
  }

  const columns = [
    {
      accessorKey: "image",
      header: "头像",
      cell: ({ row }: { row: Row<User> }) => (
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
      cell: ({ row }: { row: Row<User> }) => {
        const pw = row.original.password || "";
        return <span>{pw ? "********" : ""}</span>;
      },
    },
    {
      accessorKey: "accounts",
      header: "账号绑定",
      cell: ({ row }: { row: Row<User> }) => (
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
      cell: ({ row }: { row: Row<User> }) =>
        formatLocalTime(row.original.createdAt),
    },
    {
      accessorKey: "lastLoginAt",
      header: "最后登录",
      cell: ({ row }: { row: Row<User> }) =>
        formatRelativeTimeLocal(row.original.lastLoginAt),
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
