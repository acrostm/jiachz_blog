"use server";

import { type Prisma, TagTypeEnum } from "@prisma/client";

import { ERROR_NO_PERMISSION, PUBLISHED_MAP } from "@/constants";
import { noPermission } from "@/features/user";
import { prisma } from "@/lib/prisma";
import { getSkip } from "@/utils";

import { DEFAULT_DAILY_REPORT_TAG } from "../constants";
import {
  type GetDailyReportsDTO,
  type UpdateDailyReportDTO,
  getDailyReportsSchema,
  updateDailyReportSchema,
} from "../types";

const dailyReportInclude = {
  tags: true,
} satisfies Prisma.DailyReportInclude;

export const getDailyReports = async (params: GetDailyReportsDTO) => {
  const result = await getDailyReportsSchema.safeParseAsync(params);

  if (!result.success) {
    throw new Error(result.error.format()._errors?.join(";") || "");
  }

  const where: Prisma.DailyReportWhereInput = {
    ...(result.data.reportType?.trim()
      ? { reportType: result.data.reportType.trim() }
      : {}),
    ...(result.data.date?.trim() ? { date: result.data.date.trim() } : {}),
    ...(result.data.title?.trim()
      ? { title: { contains: result.data.title.trim() } }
      : {}),
    ...(result.data.tags?.length
      ? { tags: { some: { id: { in: result.data.tags } } } }
      : {}),
  };

  const published = PUBLISHED_MAP[result.data.published!];
  if (published !== undefined) {
    where.published = published;
  }

  const orderBy: Prisma.DailyReportOrderByWithRelationInput | undefined =
    result.data.orderBy && result.data.order
      ? { [result.data.orderBy]: result.data.order }
      : { date: "desc" };

  const [reports, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      include: dailyReportInclude,
      orderBy,
      take: result.data.pageSize,
      skip: getSkip(result.data.pageIndex, result.data.pageSize),
    }),
    prisma.dailyReport.count({ where }),
  ]);

  return { reports, total };
};

export const getPublishedDailyReportArchive = async () => {
  try {
    const reports = await prisma.dailyReport.findMany({
      where: { published: true },
      select: {
        date: true,
        reportType: true,
      },
      orderBy: [{ date: "desc" }, { reportType: "asc" }],
    });

    return {
      reports,
      dates: Array.from(new Set(reports.map((report) => report.date))),
      reportTypes: Array.from(
        new Set(reports.map((report) => report.reportType)),
      ),
    };
  } catch {
    return { reports: [], dates: [], reportTypes: [] };
  }
};

export const getPublishedDailyReportsByDate = async (
  date: string,
  reportType?: string,
) => {
  if (!date) return { reports: [] };

  try {
    const reports = await prisma.dailyReport.findMany({
      where: {
        date,
        published: true,
        ...(reportType ? { reportType } : {}),
      },
      include: dailyReportInclude,
      orderBy: [{ reportType: "asc" }, { createdAt: "desc" }],
    });

    return { reports };
  } catch {
    return { reports: [] };
  }
};

export const getDailyReportByID = async (id: string) => {
  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: dailyReportInclude,
  });

  return { report };
};

export const updateDailyReport = async (params: UpdateDailyReportDTO) => {
  if (await noPermission()) {
    return {
      success: false,
      error: ERROR_NO_PERMISSION.message,
    };
  }

  const result = await updateDailyReportSchema.safeParseAsync(params);

  if (!result.success) {
    return {
      success: false,
      error: result.error.format()._errors?.join(";") || "参数错误",
    };
  }

  const { id, tags, sources, metadata, generatedAt, ...data } = result.data;
  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: dailyReportInclude,
  });

  if (!report) {
    return { success: false, error: "日报不存在" };
  }

  const defaultTag = await prisma.tag.upsert({
    where: { slug: DEFAULT_DAILY_REPORT_TAG.slug },
    create: {
      ...DEFAULT_DAILY_REPORT_TAG,
      type: TagTypeEnum.DAILY_REPORT,
    },
    update: {
      type: TagTypeEnum.DAILY_REPORT,
    },
  });
  const reportTags = new Set(report.tags.map((tag) => tag.id));
  const normalizedTags =
    tags === undefined
      ? undefined
      : Array.from(new Set([...tags, defaultTag.id]));
  const tagsToConnect = normalizedTags
    ?.filter((tagID) => !reportTags.has(tagID))
    .map((tagID) => ({ id: tagID }));
  const tagsToDisconnect = Array.from(reportTags)
    .filter((tagID) => !normalizedTags?.includes(tagID))
    .map((tagID) => ({ id: tagID }));
  const shouldConnectDefaultTag =
    normalizedTags === undefined && !reportTags.has(defaultTag.id);

  try {
    await prisma.dailyReport.update({
      where: { id },
      data: {
        ...data,
        ...(sources === undefined ? {} : { sources }),
        ...(metadata === undefined
          ? {}
          : { metadata: metadata as Prisma.InputJsonValue }),
        ...(generatedAt === undefined
          ? {}
          : { generatedAt: new Date(generatedAt) }),
        ...(normalizedTags === undefined
          ? shouldConnectDefaultTag
            ? {
                tags: {
                  connect: [{ id: defaultTag.id }],
                },
              }
            : {}
          : {
              tags: {
                connect: tagsToConnect?.length ? tagsToConnect : undefined,
                disconnect: tagsToDisconnect?.length
                  ? tagsToDisconnect
                  : undefined,
              },
            }),
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "更新日报失败，请重试" };
  }
};

export const toggleDailyReportPublished = async (id: string) => {
  if (await noPermission()) {
    throw ERROR_NO_PERMISSION;
  }

  const report = await prisma.dailyReport.findUnique({
    where: { id },
    select: {
      published: true,
    },
  });

  if (!report) {
    throw new Error("日报不存在");
  }

  await prisma.dailyReport.update({
    where: { id },
    data: {
      published: !report.published,
    },
  });
};
