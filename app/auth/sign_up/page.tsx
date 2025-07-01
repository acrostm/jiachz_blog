import { type Metadata } from "next";
import Link from "next/link";

import { UserAuthForm } from "@/components/authentication/user-auth-form";
import { Wrapper } from "@/components/wrapper";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export default function AuthenticationPage() {
  return (
    <Wrapper className="flex min-h-screen items-center justify-center px-6 pb-24 pt-8">
      <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <video
            src={`https://r2.jiachz.com/sign-in-page-video.mp4`}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 size-full object-cover"
          />
          <div className="relative z-20 flex items-center text-lg font-medium">
            Jiachz.com
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This library has saved me countless hours of work and
                helped me deliver stunning designs to my clients faster than
                ever before.&rdquo;
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
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
    </Wrapper>
  );
}
