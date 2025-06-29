import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { NextLink } from "@/components/next-link";

// import { SignInPage } from "@/features/auth";
import { NICKNAME, WEBSITE } from "@/constants";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 左侧表单区 */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <NextLink
            href="/"
            className={cn("mr-4 hidden sm:flex")}
            aria-label={NICKNAME}
          >
            <Logo />
            <span className="ml-2 text-base font-semibold text-primary">
              {WEBSITE}
            </span>
          </NextLink>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      {/* 右侧视频区 */}
      <div className="relative hidden bg-muted lg:block">
        <video
          src={`https://r2.jiachz.com/sign-in-page-video.mp4`}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    </div>
  );
}
