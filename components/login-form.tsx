"use client";

import { useState } from "react";
import * as React from "react";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PATHS } from "@/constants";
import { cn } from "@/lib/utils";

import { IconBrandGithub } from "./icons/fa6-brands";
import { IconLogoGoogle } from "./icons/logos";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">登录到你的账户</h1>
        <p className="text-balance text-sm text-muted-foreground">
          输入你的邮箱登录到你的账户
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">密码</Label>
            {/* <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a> */}
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          登录
        </Button>
        <Button
          variant="outline"
          className="!w-full"
          type="button"
          onClick={handleGoHome}
          disabled={loading}
        >
          回首页
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            或者使用以下登录方式
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignInWithGithub}
          disabled={loading}
        >
          <IconBrandGithub className="mr-2 text-base" /> 使用 Github 登录
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignInWithGoogle}
          disabled={loading}
        >
          <IconLogoGoogle className="mr-2 text-base" /> 使用 Google 登录
        </Button>
      </div>
      <div className="text-center text-sm">
        还没有账户？{" "}
        <a href="/auth/sign_up" className="underline underline-offset-4">
          注册
        </a>
      </div>
    </form>
  );

  async function handleSignInWithGithub() {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("github", { callbackUrl: "/" });
      // next-auth/react的signIn返回undefined，跳转由next-auth处理
      // 但如果有报错，可以捕获
      if (res?.error) {
        let errorMessage = "GitHub 登录失败，请重试";
        if (
          res.error.includes("OAuthSignin") ||
          res.error.includes("OAuthCallback")
        ) {
          errorMessage = "GitHub 授权失败，请检查网络连接或稍后重试";
        } else if (res.error.includes("OAuthAccountNotLinked")) {
          errorMessage =
            "该 GitHub 账户未关联到现有用户，请使用其他方式登录或联系管理员";
        } else if (res.error.includes("AccessDenied")) {
          errorMessage = "GitHub 授权被拒绝，请重新尝试授权";
        }

        setError(errorMessage);
        toast.error(errorMessage);

        // 记录 OAuth 登录失败日志
        try {
          await fetch("/api/auth/log-failed-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "",
              errorType: res.error,
              loginMethod: "OAUTH_GITHUB",
            }),
          });
        } catch {
          // 静默处理日志记录失败
        }
      }
    } catch {
      const errorMessage = "GitHub 登录连接失败，请检查网络连接后重试";
      setError(errorMessage);
      toast.error(errorMessage);

      // 记录网络错误
      try {
        await fetch("/api/auth/log-failed-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "",
            errorType: "网络连接失败",
            loginMethod: "OAUTH_GITHUB",
          }),
        });
      } catch {
        // 静默处理日志记录失败
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("google", { callbackUrl: "/" });
      if (res?.error) {
        let errorMessage = "Google 登录失败，请重试";
        if (
          res.error.includes("OAuthSignin") ||
          res.error.includes("OAuthCallback")
        ) {
          errorMessage = "Google 授权失败，请检查网络连接或稍后重试";
        } else if (res.error.includes("OAuthAccountNotLinked")) {
          errorMessage =
            "该 Google 账户未关联到现有用户，请使用其他方式登录或联系管理员";
        } else if (res.error.includes("AccessDenied")) {
          errorMessage = "Google 授权被拒绝，请重新尝试授权";
        }

        setError(errorMessage);
        toast.error(errorMessage);

        // 记录 OAuth 登录失败日志
        try {
          await fetch("/api/auth/log-failed-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "",
              errorType: res.error,
              loginMethod: "OAUTH_GOOGLE",
            }),
          });
        } catch {
          // 静默处理日志记录失败
        }
      }
    } catch {
      const errorMessage = "Google 登录连接失败，请检查网络连接后重试";
      setError(errorMessage);
      toast.error(errorMessage);

      // 记录网络错误
      try {
        await fetch("/api/auth/log-failed-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "",
            errorType: "网络连接失败",
            loginMethod: "OAUTH_GOOGLE",
          }),
        });
      } catch {
        // 静默处理日志记录失败
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGoHome() {
    router.push(PATHS.SITE_HOME);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: PATHS.ADMIN_HOME,
      });
      if (res?.error) {
        // 将英文错误转换为中文具体提示
        let errorMessage = "登录失败，请重试";
        if (
          res.error === "请输入邮箱和密码" ||
          res.error.includes("邮箱和密码")
        ) {
          errorMessage = "请输入邮箱和密码";
        } else if (
          res.error === "UserNotFound" ||
          res.error === "用户不存在或未设置密码" ||
          res.error.includes("用户不存在")
        ) {
          errorMessage = "用户不存在，请检查邮箱地址或先注册账户";
        } else if (
          res.error === "PasswordError" ||
          res.error === "密码错误" ||
          res.error.includes("密码错误") ||
          res.error.includes("Invalid credentials") ||
          res.error.includes("CredentialsSignin") ||
          res.error === "CallbackRouteError" ||
          res.error.includes("Configuration") ||
          res.error.includes("配置")
        ) {
          errorMessage = "用户名或者密码错误";
        } else {
          // 保留自定义的中文错误信息
          errorMessage = res.error;
        }

        setError(errorMessage);
        toast.error(errorMessage);

        // 记录登录失败日志
        try {
          await fetch("/api/auth/log-failed-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              errorType: res.error,
              loginMethod: "CREDENTIALS",
            }),
          });
        } catch {
          // 静默处理日志记录失败
        }
      } else if (res?.ok) {
        router.push(PATHS.ADMIN_HOME);
      }
    } catch {
      const errorMessage = "登录连接失败，请检查网络连接后重试";
      setError(errorMessage);
      toast.error(errorMessage);

      // 记录网络错误
      try {
        await fetch("/api/auth/log-failed-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            errorType: "网络连接失败",
            loginMethod: "CREDENTIALS",
          }),
        });
      } catch {
        // 静默处理日志记录失败
      }
    } finally {
      setLoading(false);
    }
  }
}
