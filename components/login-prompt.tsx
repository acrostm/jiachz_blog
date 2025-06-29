"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { showWarningToast } from "@/components/ui/toast";

interface LoginPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginPrompt = ({ open, onOpenChange }: LoginPromptProps) => {
  const router = useRouter();

  React.useEffect(() => {
    if (open) {
      showWarningToast("请先登录后再查看博客内容", {
        duration: 2000,
      });

      // 2秒后自动跳转到登录页面
      const timer = setTimeout(() => {
        router.push("/auth/sign_in");
      }, 2000);

      onOpenChange(false);

      return () => clearTimeout(timer);
    }
  }, [open, onOpenChange, router]);

  return null;
};
