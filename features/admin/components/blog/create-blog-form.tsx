"use client";

import React from "react";
import { useForm } from "react-hook-form";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { TagTypeEnum } from "@prisma/client";
import { toast } from "sonner";

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
  type CreateBlogDTO,
  createBlogSchema,
  useCreateBlog,
} from "@/features/blog";
import { useGetAllTags } from "@/features/tag";
import { uploadFile } from "@/features/upload";
import { toSlug } from "@/lib/utils";

export const CreateBlogForm = () => {
  const router = useRouter();
  const { data: session } = useSession();

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
      tags: [],
    },
  });

  return (
    <Form {...form}>
      <form autoComplete="off">
        <div className="fixed inset-x-6 bottom-8 z-10 md:inset-x-[15vw] lg:inset-x-[25vw]">
          <Button
            type="button"
            onClick={() => form.handleSubmit(handleSubmit)()}
            variant={"outline"}
            className="!w-full"
          >
            创建
          </Button>
        </div>

        <div className="grid gap-6 px-1 pb-24">
          {/* 标题 */}
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
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Slug和标签 */}
          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        {...field}
                        placeholder="slug"
                        value={field.value ?? ""}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleFormatSlug}
                        size="sm"
                        variant="outline"
                        className="px-4"
                      >
                        格式化
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Combobox
                        options={
                          tags?.map((el) => ({
                            label: el.name,
                            value: el.id,
                          })) ?? []
                        }
                        multiple
                        clearable
                        selectPlaceholder="选择标签"
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

          {/* 发布状态 */}
          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel className="text-sm font-medium">
                    是否发布
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 描述和封面 */}
          <div className="grid gap-4 md:grid-cols-2">
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
                      className="min-h-[140px] resize-y"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cover"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>封面</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Textarea
                        {...field}
                        placeholder="请输入封面链接"
                        value={field.value ?? ""}
                        className="min-h-[80px] resize-y"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          try {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fd = new FormData();
                              fd.append("file", file);
                              const toastID = toast.loading("上传中");
                              const { url, error } = await uploadFile(fd);
                              toast.dismiss(toastID);
                              if (error) {
                                toast.error(error);
                                return [];
                              }
                              if (url) {
                                toast.success("上传成功");
                              }
                              setCover(url ?? "");
                              form.setValue("cover", url ?? "");
                            } else {
                              toast.info("请选择一个文件");
                            }
                          } catch (error) {
                            toast.error(error as string);
                          }
                        }}
                      />
                      {Boolean(cover) && (
                        <div className="relative">
                          <img
                            src={cover}
                            className="max-h-[120px] w-full rounded-md border object-contain"
                            alt="封面预览"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
    await createBlogQuery.runAsync({
      ...values,
      author: session?.user?.name ?? "",
    });
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
