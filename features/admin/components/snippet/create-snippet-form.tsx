"use client";

import React from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { TagTypeEnum } from "@prisma/client";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { BytemdEditor } from "@/components/bytemd";

import { PATHS } from "@/constants";
import { CreateTagButton } from "@/features/admin";
import {
  type CreateSnippetDTO,
  createSnippetSchema,
  useCreateSnippet,
} from "@/features/snippet";
import { useGetAllTags } from "@/features/tag";
import { toSlug } from "@/lib/utils";

export const CreateSnippetForm = () => {
  const router = useRouter();

  const getTagsQuery = useGetAllTags(TagTypeEnum.SNIPPET);
  const tags = React.useMemo(() => {
    return getTagsQuery.data?.tags ?? [];
  }, [getTagsQuery]);

  const createSnippetQuery = useCreateSnippet();

  const form = useForm<CreateSnippetDTO>({
    resolver: zodResolver(createSnippetSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      published: true,
      body: "",
      tags: [],
    },
  });

  return (
    <Form {...form}>
      <form autoComplete="off">
        <div className="fixed inset-x-24 bottom-10 z-10 md:inset-x-[20vw]">
          <Button
            type="button"
            onClick={() => form.handleSubmit(handleSubmit)()}
            variant={"outline"}
            disabled={createSnippetQuery.loading}
            className="!w-full"
          >
            {createSnippetQuery.loading && (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            )}
            创建
          </Button>
        </div>

        <div className="grid gap-4 px-1 pb-24">
          {/* 第一行：标题、slug、标签、是否发布，右侧留空 */}
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="w-full md:w-80">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="请输入标题"
                        className="w-full"
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex w-full items-end gap-2 md:w-96">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>slug</FormLabel>
                    <FormControl>
                      <div className="flex w-full items-center gap-2">
                        <Input
                          {...field}
                          placeholder="slug"
                          className="w-full"
                          value={field.value ?? ""}
                        />
                        <Button
                          type="button"
                          onClick={handleFormatSlug}
                          size="sm"
                          className="shrink-0"
                        >
                          格式化
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex w-full items-end gap-2 md:w-96">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>标签</FormLabel>
                    <FormControl>
                      <div className="flex w-full items-center gap-2">
                        <Combobox
                          options={
                            tags?.map((el) => ({
                              label: el.name,
                              value: el.id,
                            })) ?? []
                          }
                          multiple
                          clearable
                          selectPlaceholder="标签"
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                        <CreateTagButton
                          refreshAsync={getTagsQuery.refreshAsync}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex w-full items-end md:w-32">
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex h-full items-center">
                    <FormLabel className="mb-0 mr-2 flex h-full items-center">
                      是否发布
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="ml-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex-1" />
          </div>

          {/* 第二行：描述 */}
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="请输入描述"
                        value={field.value ?? ""}
                        className="h-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 内容编辑器 */}
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>内容</FormLabel>
                <FormControl>
                  <div id="content-editor">
                    <BytemdEditor
                      body={field.value}
                      setContent={field.onChange}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );

  async function handleSubmit(values: CreateSnippetDTO) {
    await createSnippetQuery.runAsync(values);
    router.push(PATHS.ADMIN_SNIPPET);
  }

  function handleFormatSlug() {
    const tmp = form.getValues().slug?.trim();
    if (tmp) {
      const formatted = toSlug(tmp);
      form.setValue("slug", formatted);
    }
  }
};
