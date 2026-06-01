"use client";

import React from "react";
import { useForm } from "react-hook-form";

import { useParams, useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { TagTypeEnum } from "@prisma/client";
import { Save } from "lucide-react";
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
  type UpdateDailyReportDTO,
  updateDailyReportSchema,
  useGetDailyReport,
  useUpdateDailyReport,
} from "@/features/daily-report";
import { useGetAllTags } from "@/features/tag";
import { toSlug } from "@/lib/utils";

export const EditDailyReportForm = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const getDailyReportQuery = useGetDailyReport(id, Boolean(id));
  const report = React.useMemo(
    () => getDailyReportQuery.data?.report,
    [getDailyReportQuery],
  );
  const getTagsQuery = useGetAllTags(TagTypeEnum.DAILY_REPORT);
  const tags = React.useMemo(
    () => getTagsQuery.data?.tags ?? [],
    [getTagsQuery],
  );
  const updateDailyReportQuery = useUpdateDailyReport();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UpdateDailyReportDTO>({
    resolver: zodResolver(updateDailyReportSchema),
    defaultValues: {
      id: "",
      reportType: "earth-pulse",
      date: "",
      slug: "",
      title: "",
      summary: "",
      body: "",
      published: true,
      tags: [],
    },
  });

  React.useEffect(() => {
    form.setValue("id", report?.id ?? "");
    form.setValue("reportType", report?.reportType ?? "earth-pulse");
    form.setValue("date", report?.date ?? "");
    form.setValue("slug", report?.slug ?? "");
    form.setValue("title", report?.title ?? "");
    form.setValue("summary", report?.summary ?? "");
    form.setValue("body", report?.body ?? "");
    form.setValue("published", report?.published ?? true);
    form.setValue("tags", report?.tags.map((tag) => tag.id) ?? []);
  }, [form, report]);

  return (
    <Form {...form}>
      <form autoComplete="off">
        <div className="fixed inset-x-6 bottom-8 z-10 md:inset-x-[15vw] lg:inset-x-[25vw]">
          <Button
            type="button"
            onClick={() => form.handleSubmit(handleSubmit)()}
            variant="outline"
            className="!w-full"
            disabled={isSubmitting || updateDailyReportQuery.loading}
          >
            {isSubmitting || updateDailyReportQuery.loading
              ? "保存中..."
              : "保存"}
            <Save className="ml-1 size-4" />
          </Button>
        </div>

        <div className="grid gap-6 px-1 pb-24">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标题</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入标题" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>日报类型</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="earth-pulse" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>日期</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input {...field} placeholder="slug" className="flex-1" />
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
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Combobox
                        options={tags.map((tag) => ({
                          label: tag.name,
                          value: tag.id,
                        }))}
                        multiple
                        clearable
                        selectPlaceholder="选择标签"
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                      <CreateTagButton
                        defaultType={TagTypeEnum.DAILY_REPORT}
                        refreshAsync={getTagsQuery.refreshAsync}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 pb-2">
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

          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>摘要</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="请输入摘要"
                    className="min-h-[120px] resize-y"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>内容</FormLabel>
                <FormControl>
                  <div id="daily-report-content-editor">
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

  async function handleSubmit(values: UpdateDailyReportDTO) {
    if (isSubmitting || updateDailyReportQuery.loading) return;

    try {
      setIsSubmitting(true);
      await updateDailyReportQuery.runAsync(values);
      router.push(PATHS.ADMIN_DAILY_REPORTS);
    } catch {
      toast.error("更新失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFormatSlug() {
    const tmp = form.getValues().slug?.trim();
    if (tmp) {
      form.setValue("slug", toSlug(tmp));
      return;
    }

    const date = form.getValues().date;
    const reportType = form.getValues().reportType;
    if (date && reportType) {
      form.setValue("slug", toSlug(`${date}-${reportType}`));
    }
  }
};
