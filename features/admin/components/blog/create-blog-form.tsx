"use client";

import React from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { TagTypeEnum } from "@prisma/client";

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
import {
  hideToast,
  showErrorToast,
  showInfoToast,
  showLoadingToast,
  showSuccessToast,
} from "@/components/ui/toast";

import { BytemdEditor } from "@/components/bytemd";

import { PATHS } from "@/constants";
import { CreateTagButton } from "@/features/admin";
import {
  type CreateBlogDTO,
  createBlogSchema,
  useCreateBlog,
} from "@/features/blog";
import { useGetAllTags } from "@/features/tag";
import { uploadFile } from "@/features/upload";
import { toSlug } from "@/lib/utils";

export const CreateBlogForm = () => {
  const router = useRouter();

  const getTagsQuery = useGetAllTags(TagTypeEnum.BLOG);
  const tags = React.useMemo(() => {
    return getTagsQuery.data?.tags ?? [];
  }, [getTagsQuery]);

  const createBlogQuery = useCreateBlog();

  const [cover, setCover] = React.useState("");
  const form = useForm<CreateBlogDTO>({
    resolver: zodResolver(createBlogSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      body: "",
      published: true,
      cover: "",
      author: "",
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
            className="!w-full"
          >
            创建
          </Button>
        </div>

        <div className="grid gap-4 px-1 pb-24">
          {/* 第一行：标题和slug，右侧留空 */}
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
            <div className="flex-1" />
          </div>

          {/* 第二行：作者、标签、是否发布，右侧留空 */}
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="w-full md:w-80">
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>作者</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="请输入作者"
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
            <div className="flex w-full items-end md:w-24">
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>是否发布</FormLabel>
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

          {/* 第三行：描述和封面 */}
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
            <div className="flex-1">
              <FormField
                control={form.control}
                name="cover"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>封面</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="请输入封面链接"
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                    <Input
                      type="file"
                      onChange={async (e) => {
                        try {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fd = new FormData();
                            fd.append("file", file);
                            const toastID = showLoadingToast("上传中");
                            const { url, error } = await uploadFile(fd);
                            hideToast(toastID);
                            if (error) {
                              showErrorToast(error);
                              return [];
                            }
                            if (url) {
                              showSuccessToast("上传成功");
                            }
                            setCover(url ?? "");
                            form.setValue("cover", url ?? "");
                          } else {
                            showInfoToast("请选择一个文件");
                          }
                        } catch (error) {
                          showErrorToast(error as string);
                        }
                      }}
                    />
                    {Boolean(cover) && (
                      <img
                        src={cover}
                        className="mt-2 h-[120px] object-scale-down"
                        alt={""}
                      />
                    )}
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

  async function handleSubmit(values: CreateBlogDTO) {
    await createBlogQuery.runAsync(values);
    router.push(PATHS.ADMIN_BLOG);
  }

  function handleFormatSlug() {
    const tmp = form.getValues().slug?.trim();
    if (tmp) {
      const formatted = toSlug(tmp);
      form.setValue("slug", formatted);
    }
  }
};
