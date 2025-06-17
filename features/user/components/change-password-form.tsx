"use client";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { type UpdatePasswordDTO, updatePasswordSchema } from "@/features/auth";

import { updateUserPassword } from "../actions";

export const ChangePasswordForm = ({ userId }: { userId: string }) => {
  const form = useForm<UpdatePasswordDTO>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "" },
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>新密码</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">修改密码</Button>
      </form>
    </Form>
  );

  async function handleSubmit(values: UpdatePasswordDTO) {
    await updateUserPassword(userId, values);
    form.reset();
  }
};
