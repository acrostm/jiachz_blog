"use client";

import { useForm } from "react-hook-form";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { IconBrandGithub, IconLogoGoogle } from "@/components/icons";
import { ModeToggle } from "@/components/mode-toggle";
import { showErrorToast } from "@/components/ui/toast";

import { PATHS } from "@/constants";

import {
  signInWithCredentials,
  signInWithGithub,
  signInWithGoogle,
} from "../actions/sign-in";
import { type SignInDTO, signInSchema } from "../types";

export const SignInPage = () => {
  const router = useRouter();
  const form = useForm<SignInDTO>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[320px] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[360px] sm:max-w-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>后台登录</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>选择你喜欢的方式进行登录</CardDescription>
        </CardHeader>
        <CardFooter>
          <Form {...form}>
            <form
              className="grid w-full gap-4"
              autoComplete="off"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <Button
                variant="default"
                className="!w-full"
                type="button"
                onClick={handleSignInWithGithub}
              >
                <IconBrandGithub className="mr-2 text-base" /> 使用 Github 登录
              </Button>
              <Button
                variant="default"
                className="!w-full"
                type="button"
                onClick={handleSignInWithGoogle}
              >
                <IconLogoGoogle className="mr-2 text-base" /> 使用 Google 登录
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    或者
                  </span>
                </div>
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button variant="default" className="!w-full" type="submit">
                登录
              </Button>
              <Button
                variant="default"
                className="!w-full"
                type="button"
                onClick={handleGoHome}
              >
                回首页
              </Button>
            </form>
          </Form>
        </CardFooter>
      </Card>
    </div>
  );

  async function handleSignInWithGithub() {
    await signInWithGithub();
  }

  async function handleSignInWithGoogle() {
    await signInWithGoogle();
  }

  function handleGoHome() {
    router.push(PATHS.SITE_HOME);
  }

  async function handleSubmit(values: SignInDTO) {
    try {
      const url = await signInWithCredentials(values);
      router.push(url);
    } catch (error) {
      showErrorToast((error as Error).message);
    }
  }
};
