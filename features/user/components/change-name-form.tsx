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

import { type UpdateNameDTO, updateNameSchema } from "@/features/auth";

import { updateUserName } from "../actions";

export const ChangeNameForm = ({
  userId,
  defaultName,
}: {
  userId: string;
  defaultName: string;
}) => {
  const form = useForm<UpdateNameDTO>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name: defaultName },
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">修改用户名</Button>
      </form>
    </Form>
  );

  async function handleSubmit(values: UpdateNameDTO) {
    await updateUserName(userId, values);
    form.reset(values);
  }
};
