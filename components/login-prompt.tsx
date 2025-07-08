"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useAuth } from "@/hooks";

interface LoginPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginPrompt = ({ open, onOpenChange }: LoginPromptProps) => {
  const router = useRouter();
  const { isAuthenticated, isVerified } = useAuth();

  React.useEffect(() => {
    if (open) {
      if (!isAuthenticated) {
        toast.warning("请先登录后再查看博客内容", {
          duration: 2000,
        });

        // 2秒后自动跳转到登录页面
        const timer = setTimeout(() => {
          router.push("/auth/sign_in");
        }, 2000);

        onOpenChange(false);

        return () => clearTimeout(timer);
      } else if (!isVerified) {
        toast.warning("请验证后查看博客", {
          duration: 2000,
        });

        // 2秒后自动跳转到个人资料页面
        const timer = setTimeout(() => {
          router.push("/admin/profile");
        }, 2000);

        onOpenChange(false);

        return () => clearTimeout(timer);
      }
    }
  }, [open, onOpenChange, router, isAuthenticated, isVerified]);

  return null;
};
