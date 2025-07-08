"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useCountdown } from "@/hooks/use-countdown";

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  onSuccess: () => void;
}

export function EmailVerificationDialog({
  open,
  onOpenChange,
  userEmail,
  onSuccess,
}: EmailVerificationDialogProps) {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { count, start, isActive } = useCountdown(60);

  const handleSendOtp = async () => {
    if (isActive) return;

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as { message?: string };

      if (response.ok) {
        setSuccess("验证码已发送到您的邮箱");
        setError("");
        start();
      } else {
        setError(data.message ?? "发送验证码失败");
        setSuccess("");
      }
    } catch {
      setError("网络错误，请重试");
      setSuccess("");
    }
  };

  const handleVerifyOtp = async (value: string) => {
    if (value.length !== 6) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp: value }),
      });

      const data = (await response.json()) as { message?: string };

      if (response.ok) {
        setSuccess("验证成功！");
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          // 重置状态
          setOtp("");
          setError("");
          setSuccess("");
        }, 1000);
      } else {
        setError(data.message ?? "验证失败");
        setOtp("");
      }
    } catch {
      setError("网络错误，请重试");
      setOtp("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // 关闭时重置状态
      setOtp("");
      setError("");
      setSuccess("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>验证您的邮箱</DialogTitle>
          <DialogDescription>
            我们将向{" "}
            <span className="font-medium text-foreground">{userEmail}</span>{" "}
            发送验证码
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 发送验证码按钮 */}
          <Button
            onClick={handleSendOtp}
            disabled={isActive}
            className="w-full"
            size="lg"
          >
            {isActive ? `重新发送 (${count}s)` : "发送验证码"}
          </Button>

          {/* 成功消息 */}
          {success && (
            <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="size-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {success}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 错误消息 */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="size-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OTP输入框 */}
          <div className="space-y-4">
            <div className="text-center">
              <label className="text-sm font-medium text-muted-foreground">
                请输入6位验证码
              </label>
            </div>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value: string) => {
                  setOtp(value);
                  if (value.length === 6) {
                    void handleVerifyOtp(value);
                  }
                }}
                disabled={isSubmitting}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {isSubmitting && (
              <div className="text-center text-sm text-muted-foreground">
                正在验证...
              </div>
            )}
          </div>

          {/* 说明文字 */}
          <div className="space-y-1 text-center text-sm text-muted-foreground">
            <p>验证码有效期为60秒</p>
            <p>没有收到验证码？请检查垃圾邮件箱</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
