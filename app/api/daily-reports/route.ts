import { type NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import { SITE_URL } from "@/config";

import { ingestDailyReportSchema } from "@/features/daily-report";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SITE_URL = "https://jiachz.com";
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

const getSiteUrl = () => SITE_URL ?? DEFAULT_SITE_URL;

const getReportReadUrl = (reportType: string, date: string) => {
  const url = new URL("/api/daily-reports", getSiteUrl());
  url.searchParams.set("reportType", reportType);
  url.searchParams.set("date", date);

  return url.toString();
};

const parseLimit = (value: string | null) => {
  if (!value) return DEFAULT_LIMIT;

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1) return DEFAULT_LIMIT;

  return Math.min(limit, MAX_LIMIT);
};

const parsePublished = (value: string | null) => {
  if (value === "false") return false;
  if (value === "all") return undefined;

  return true;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const reportType = url.searchParams.get("reportType") ?? undefined;
  const date = url.searchParams.get("date") ?? undefined;
  const published = parsePublished(url.searchParams.get("published"));

  if (reportType && date) {
    const report = await prisma.dailyReport.findFirst({
      where: {
        reportType,
        date,
        ...(published === undefined ? {} : { published }),
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Daily report not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      report,
      url: getReportReadUrl(report.reportType, report.date),
    });
  }

  const reports = await prisma.dailyReport.findMany({
    where: {
      ...(reportType ? { reportType } : {}),
      ...(date ? { date } : {}),
      ...(published === undefined ? {} : { published }),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: parseLimit(url.searchParams.get("limit")),
  });

  return NextResponse.json({ success: true, reports });
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const result = await ingestDailyReportSchema.safeParseAsync(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid daily report payload",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = result.data;
  const slug = data.slug ?? `${data.date}-${data.reportType}`;
  const generatedAt = data.generatedAt
    ? new Date(data.generatedAt)
    : new Date();
  const metadata =
    data.metadata === undefined
      ? undefined
      : (data.metadata as Prisma.InputJsonValue);

  try {
    const report = await prisma.dailyReport.upsert({
      where: {
        reportType_date: {
          reportType: data.reportType,
          date: data.date,
        },
      },
      create: {
        reportType: data.reportType,
        date: data.date,
        slug,
        title: data.title,
        summary: data.summary,
        body: data.body,
        sources: data.sources,
        metadata,
        generatedAt,
        published: data.published,
      },
      update: {
        slug,
        title: data.title,
        summary: data.summary,
        body: data.body,
        sources: data.sources,
        ...(metadata === undefined ? {} : { metadata }),
        generatedAt,
        published: data.published,
      },
    });

    return NextResponse.json({
      success: true,
      report,
      url: getReportReadUrl(report.reportType, report.date),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Daily report slug already exists for another report. Use a unique slug or omit slug.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to save daily report" },
      { status: 500 },
    );
  }
}
