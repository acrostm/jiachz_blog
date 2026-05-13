"use client";

import { useState } from "react";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PasswordChangeDialog } from "./password-change-dialog";

export function PasswordChange() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      toast.error("请输入当前密码");
      return false;
    }
    if (!formData.newPassword) {
      toast.error("请输入新密码");
      return false;
    }
    if (formData.newPassword.length < 6) {
      toast.error("新密码至少6位");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return false;
    }
    return true;
  };

  const handleSubmitPasswordForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 先验证当前密码是否正确，以及新密码是否与当前密码相同
      const response = await fetch("/api/auth/verify-current-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        // 密码验证通过，打开 OTP 弹窗
        setShowOtpDialog(true);
      } else {
        const error = (await response.json()) as { message?: string };
        toast.error(error.message ?? "当前密码验证失败");
      }
    } catch {
      toast.error("验证失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowOtpDialog(false);
  };

  const handleDialogClose = () => {
    setShowOtpDialog(false);
  };

  const handleSuccessClose = () => {
    // 密码修改成功后，重置表单并关闭折叠面板
    resetForm();
    setIsOpen(false);
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            修改密码
            {isOpen ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="future-card rounded-2xl p-6">
            <form onSubmit={handleSubmitPasswordForm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">当前密码</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange("currentPassword", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="请输入新密码（至少6位）"
                  value={formData.newPassword}
                  onChange={(e) =>
                    handleInputChange("newPassword", e.target.value)
                  }
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "验证中..." : "验证并继续"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  取消
                </Button>
              </div>
            </form>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <PasswordChangeDialog
        open={showOtpDialog}
        onOpenChange={handleDialogClose}
        passwordData={{
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }}
        onSuccess={handleSuccessClose}
      />
    </>
  );
}
