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

import { ModeToggle } from "@/components/mode-toggle";
import { showErrorToast } from "@/components/ui/toast";

import { PATHS } from "@/constants";

import { signUpWithCredentials } from "../actions/sign-up";
import { type SignupDTO, signupSchema } from "../types";

export const SignUpPage = () => {
  const router = useRouter();
  const form = useForm<SignupDTO>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[320px] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[360px] sm:max-w-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>注册账号</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>填写信息完成注册</CardDescription>
        </CardHeader>
        <CardFooter>
          <Form {...form}>
            <form
              autoComplete="off"
              className="grid w-full gap-4"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入用户名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
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
              <Button type="submit" className="!w-full">
                注册
              </Button>
            </form>
          </Form>
        </CardFooter>
      </Card>
    </div>
  );

  async function handleSubmit(values: SignupDTO) {
    try {
      const url = await signUpWithCredentials(values);
      router.push(url);
    } catch (error) {
      showErrorToast((error as Error).message);
    }
  }
};
