"use client";

import React, { useEffect, useState } from "react";

import { Bell, Plus, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";
import type { BarkConfigItem } from "@/lib/bark-config";

import { AdminContentLayout } from "../../components";

export const BarkConfigPage = () => {
  const [configs, setConfigs] = useState<BarkConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BarkConfigItem | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    enabled: true,
    defaultGroup: "Blog",
    defaultCategory: "通知",
    defaultIcon: "https://r2.jiachz.com/jiachz-light.svg",
    defaultSound: "default",
    description: "",
  });

  // 加载配置
  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/bark-config", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load configs");
      const data = (await response.json()) as { configs: BarkConfigItem[] };
      setConfigs(data.configs);
    } catch (error) {
      console.error(error);
      toast.error("无法加载Bark配置");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfigs();
  }, []);

  // 打开新增/编辑对话框
  const openDialog = (config?: BarkConfigItem) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        name: config.name,
        url: config.url,
        enabled: config.enabled,
        defaultGroup: config.defaultGroup,
        defaultCategory: config.defaultCategory,
        defaultIcon: config.defaultIcon,
        defaultSound: config.defaultSound,
        description: config.description ?? "",
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: "",
        url: "",
        enabled: true,
        defaultGroup: "Blog",
        defaultCategory: "通知",
        defaultIcon: "https://r2.jiachz.com/jiachz-light.svg",
        defaultSound: "default",
        description: "",
      });
    }
    setDialogOpen(true);
  };

  // 保存配置
  const saveConfig = async () => {
    try {
      const url = editingConfig
        ? "/api/admin/bark-config"
        : "/api/admin/bark-config";
      const method = editingConfig ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingConfig ? { id: editingConfig.id, ...formData } : formData,
        ),
      });

      if (!response.ok) throw new Error("Failed to save config");

      toast.success(editingConfig ? "配置已更新" : "配置已创建");

      setDialogOpen(false);
      await loadConfigs();
    } catch (error) {
      console.error(error);
      toast.error("无法保存Bark配置");
    }
  };

  // 删除配置
  const deleteConfig = async (id: string) => {
    if (!confirm("确定要删除这个配置吗？")) return;

    try {
      const response = await fetch(
        `/api/admin/bark-config?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          cache: "no-store",
        },
      );

      if (!response.ok) throw new Error("Failed to delete config");

      toast.success("配置已删除");

      await loadConfigs();
    } catch (error) {
      console.error(error);
      toast.error("无法删除Bark配置");
    }
  };

  // 测试通知
  const testNotification = async () => {
    try {
      const response = await fetch("/api/admin/bark-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error("Failed to send test notification");

      toast.success("测试通知已发送，请检查你的设备是否收到通知");
    } catch (error) {
      console.error(error);
      toast.error("无法发送测试通知");
    }
  };

  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[PATHS.ADMIN_HOME, PATHS.ADMIN_BARK_CONFIG]}
        />
      }
    >
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bark通知配置</h1>
            <p className="mt-2 text-muted-foreground">
              管理Bark通知服务配置，支持多个通知端点
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={testNotification} variant="outline">
              <Bell className="mr-2 size-4" />
              测试通知
            </Button>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 size-4" />
              添加配置
            </Button>
          </div>
        </div>

        {/* 配置列表 */}
        {loading ? (
          <div className="py-12 text-center">加载中...</div>
        ) : configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无配置，点击"添加配置"按钮创建第一个Bark通知配置
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {configs.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                        {config.enabled ? (
                          <span className="text-xs font-normal text-green-600 dark:text-green-400">
                            已启用
                          </span>
                        ) : (
                          <span className="text-xs font-normal text-gray-500">
                            已禁用
                          </span>
                        )}
                      </CardTitle>
                      {config.description && (
                        <CardDescription className="mt-1">
                          {config.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDialog(config)}
                      >
                        <Settings className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteConfig(config.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">URL:</span>{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                          {config.url}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">默认分组:</span>{" "}
                        {config.defaultGroup}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">默认分类:</span>{" "}
                        {config.defaultCategory}
                      </div>
                      <div>
                        <span className="font-medium">默认音效:</span>{" "}
                        {config.defaultSound}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">默认图标:</span>{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        {config.defaultIcon}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 新增/编辑对话框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "编辑配置" : "添加配置"}
              </DialogTitle>
              <DialogDescription>
                配置Bark通知服务的基本信息和默认参数
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">配置名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如: 主通知"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="url">Bark URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://bark.jiachz.com/your-key/"
                />
                <p className="text-xs text-muted-foreground">
                  完整的Bark服务器URL，包含API密钥
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enabled: checked })
                  }
                />
                <Label htmlFor="enabled">启用此配置</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="defaultGroup">默认分组</Label>
                  <Input
                    id="defaultGroup"
                    value={formData.defaultGroup}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultGroup: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="defaultCategory">默认分类</Label>
                  <Input
                    id="defaultCategory"
                    value={formData.defaultCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultCategory: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="defaultIcon">默认图标URL</Label>
                <Input
                  id="defaultIcon"
                  value={formData.defaultIcon}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultIcon: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="defaultSound">默认音效</Label>
                <Input
                  id="defaultSound"
                  value={formData.defaultSound}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultSound: e.target.value })
                  }
                  placeholder="default"
                />
                <p className="text-xs text-muted-foreground">
                  常用音效: default, bell.caf, shake.caf, ladder.caf, alert.caf
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="可选：添加配置描述"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={saveConfig}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminContentLayout>
  );
};
