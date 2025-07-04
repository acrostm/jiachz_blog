"use client";

import * as React from "react";
import { useState } from "react";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showErrorToast } from "@/components/ui/toast";

import { IconLogoSpinner } from "@/components/icons";

import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>;

interface RegisterResponse {
  message?: string;
  url?: string;
  error?: string;
}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const router = useRouter();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarError, setAvatarError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setAvatarError(null);
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    if (!email || !name || !password || !confirmPassword) {
      setError("请填写所有字段");
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      setIsLoading(false);
      return;
    }
    let image = "";
    if (avatar) {
      if (avatar.size > 1024 * 1024) {
        setAvatarError("头像文件不能超过1MB");
        setIsLoading(false);
        return;
      }
      const avatarForm = new FormData();
      avatarForm.append("file", avatar);
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: avatarForm,
      });
      const data = (await res.json()) as RegisterResponse;
      if (!res.ok || !data.url) {
        setAvatarError(data.error || "头像上传失败");
        setIsLoading(false);
        return;
      }
      image = data.url;
      setAvatarUrl(image);
    }
    try {
      // 调用自定义注册API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, image }),
      });
      const data = (await res.json()) as RegisterResponse;
      let errorMsg = "注册失败";
      if (!res.ok) {
        if (
          typeof data === "object" &&
          data &&
          "message" in data &&
          typeof data.message === "string"
        ) {
          errorMsg = data.message;
        }
        setError(errorMsg);
        showErrorToast(errorMsg);
        setIsLoading(false);
        return;
      }
      // 注册成功后自动登录
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/admin",
      });
      router.push("/admin");
    } catch (e) {
      setError("注册失败，请重试");
      showErrorToast("注册失败，请重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="avatar">头像（不超过1MB）</Label>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              disabled={isLoading}
              onChange={(e) => {
                setAvatarError(null);
                if (e.target.files?.[0]) {
                  setAvatar(e.target.files[0]);
                } else {
                  setAvatar(null);
                }
              }}
            />
            {avatarError && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>头像上传失败！</AlertTitle>
                <AlertDescription>
                  <p>{avatarError}</p>
                </AlertDescription>
              </Alert>
            )}
            <Avatar>
              <AvatarImage src={avatarUrl} alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              name="name"
              placeholder="请输入姓名"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              placeholder="请输入密码"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              placeholder="请再次输入密码"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              required
            />
          </div>
          <Button disabled={isLoading} type="submit">
            {isLoading && (
              <IconLogoSpinner className="mr-2 size-4 animate-spin" />
            )}
            注册
          </Button>
        </div>
      </form>
    </div>
  );
}
