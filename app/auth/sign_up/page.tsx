import { type Metadata } from "next";
import Link from "next/link";

import { UserAuthForm } from "@/components/authentication/user-auth-form";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export default function AuthenticationPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 左侧表单区 */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link
            href="/"
            className="mr-4 hidden sm:flex"
            aria-label="Jiachz.com"
          >
            <span className="ml-2 text-base font-semibold text-primary">
              Jiachz.com
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="flex flex-col space-y-6">
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  注册新账户
                </h1>
                <p className="text-sm text-muted-foreground">
                  输入你的邮箱创建新账户
                </p>
              </div>
              <UserAuthForm />
              <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <Link
                  href="/coming-soon"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/coming-soon"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* 右侧视频区 */}
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-zinc-900" />
        <video
          src={`https://r2.jiachz.com/sign-in-page-video.mp4`}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 size-full object-cover"
        />
        <div className="relative z-20 flex items-center p-10 text-lg font-medium">
          <Link href="/" className="text-white">
            Jiachz.com
          </Link>
        </div>
        <div className="relative z-20 mt-auto p-10">
          <blockquote className="space-y-2">
            <p className="text-lg text-white">
              &ldquo;This library has saved me countless hours of work and
              helped me deliver stunning designs to my clients faster than ever
              before.&rdquo;
            </p>
            <footer className="text-sm text-white">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
