import { z } from "zod";

import { PUBLISHED_ENUM, REGEX } from "@/constants";

import { type getDailyReports } from "../actions";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const REPORT_TYPE_REGEX = /^[a-z0-9][a-z0-9-]{0,79}$/;

const isValidDateOnly = (value: string) => {
  const parts = value.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const dailyReportSourceSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url().max(2000),
});

export const ingestDailyReportSchema = z.object({
  reportType: z
    .string()
    .regex(REPORT_TYPE_REGEX, {
      message: "reportType 只允许小写字母、数字和中横线",
    })
    .default("earth-pulse"),
  date: z
    .string()
    .regex(DATE_ONLY_REGEX, { message: "date 必须是 YYYY-MM-DD 格式" })
    .refine(isValidDateOnly, { message: "date 不是有效日期" }),
  slug: z
    .string()
    .regex(REGEX.SLUG, {
      message: "slug 只允许小写字母、数字和中横线",
    })
    .optional(),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(3000),
  body: z.string().min(1).max(300000),
  sources: z.array(dailyReportSourceSchema).max(100).default([]),
  metadata: z.record(z.unknown()).optional(),
  generatedAt: z.string().datetime({ offset: true }).optional(),
  published: z.boolean().default(true),
});

export const updateDailyReportSchema = ingestDailyReportSchema
  .partial()
  .extend({
    id: z.string().min(1),
    tags: z.string().array().optional(),
  });

export const getDailyReportsSchema = z.object({
  title: z.string().optional(),
  reportType: z.string().optional(),
  date: z.string().optional(),
  published: z
    .enum([
      PUBLISHED_ENUM.ALL,
      PUBLISHED_ENUM.PUBLISHED,
      PUBLISHED_ENUM.NO_PUBLISHED,
    ])
    .optional(),
  tags: z.string().array().optional(),
  pageIndex: z.number(),
  pageSize: z.number(),
  orderBy: z.enum(["date", "createdAt", "updatedAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type IngestDailyReportDTO = z.infer<typeof ingestDailyReportSchema>;
export type UpdateDailyReportDTO = z.infer<typeof updateDailyReportSchema>;
export type GetDailyReportsDTO = z.infer<typeof getDailyReportsSchema>;
export type DailyReport = Awaited<
  ReturnType<typeof getDailyReports>
>["reports"][number];
