"use client";

import React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TagTypeEnum } from "@prisma/client";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useSetState } from "ahooks";
import { isUndefined } from "lodash-es";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Calendar,
  Eye,
  FileText,
  Layers3,
  Pen,
  RotateCw,
  Search,
  TagsIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Highlight } from "@/components/highlight";
import { IllustrationNoContent } from "@/components/illustrations";
import { PageBreadcrumb } from "@/components/page-header";

import {
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
  PATHS,
  PLACEHOLDER_TEXT,
  PUBLISHED_ENUM,
  PUBLISHED_LABEL_MAP,
} from "@/constants";
import {
  type DailyReport,
  type GetDailyReportsDTO,
  useGetDailyReports,
} from "@/features/daily-report";
import { useGetAllTags } from "@/features/tag";
import { cn, toSlashDateString } from "@/lib/utils";

import {
  AdminContentLayout,
  SearchByTags,
  ToggleDailyReportPublishSwitch,
} from "../../components";

export const AdminDailyReportListPage = () => {
  const router = useRouter();
  const [params, updateParams] = useSetState<GetDailyReportsDTO>({
    pageIndex: DEFAULT_PAGE_INDEX,
    pageSize: DEFAULT_PAGE_SIZE,
    order: "desc",
    orderBy: "date",
  });
  const [inputParams, updateInputParams] = useSetState<
    Omit<GetDailyReportsDTO, "pageIndex" | "pageSize">
  >({
    title: undefined,
    reportType: undefined,
    date: undefined,
    published: undefined,
    tags: undefined,
  });
  const getDailyReportsQuery = useGetDailyReports(params);
  const data = React.useMemo(
    () => getDailyReportsQuery.data?.reports ?? [],
    [getDailyReportsQuery],
  );
  const getTagsQuery = useGetAllTags(TagTypeEnum.DAILY_REPORT);
  const tags = React.useMemo(
    () => getTagsQuery.data?.tags ?? [],
    [getTagsQuery],
  );

  const columns: ColumnDef<DailyReport>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: () => (
        <div className="flex items-center space-x-1">
          <FileText className="size-4" />
          <span>标题</span>
        </div>
      ),
      cell: ({ row }: { row: Row<DailyReport> }) => (
        <Highlight
          sourceString={row.original.title}
          searchWords={params.title ? [params.title] : undefined}
        />
      ),
    },
    {
      accessorKey: "reportType",
      header: () => (
        <div className="flex items-center space-x-1">
          <Layers3 className="size-4" />
          <span>类型</span>
        </div>
      ),
      cell: ({ row }: { row: Row<DailyReport> }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.reportType}
        </Badge>
      ),
    },
    {
      accessorKey: "tags",
      header: () => (
        <div className="flex items-center space-x-1">
          <TagsIcon className="size-4" />
          <span>标签</span>
        </div>
      ),
      cell: ({ row }: { row: Row<DailyReport> }) => {
        return (
          <div className="flex flex-wrap gap-2">
            {row.original.tags?.length
              ? row.original.tags.map((tag) => (
                  <Badge key={tag.id}>{tag.name}</Badge>
                ))
              : PLACEHOLDER_TEXT}
          </div>
        );
      },
    },
    {
      accessorKey: "published",
      header: () => (
        <div className="flex items-center space-x-1">
          <Eye className="size-4" />
          <span>发布状态</span>
        </div>
      ),
      cell: ({ row }: { row: Row<DailyReport> }) => (
        <ToggleDailyReportPublishSwitch
          id={row.original.id}
          published={row.original.published}
          refreshAsync={getDailyReportsQuery.refreshAsync}
        />
      ),
    },
    {
      accessorKey: "date",
      header: () => (
        <Button variant="ghost" onClick={() => handleOrderChange("date")}>
          <Calendar className="size-4" />
          <span className="mx-1">日期</span>
          {params.order === "asc" && params.orderBy === "date" && (
            <ArrowUpNarrowWide className="size-4" />
          )}
          {params.order === "desc" && params.orderBy === "date" && (
            <ArrowDownNarrowWide className="size-4" />
          )}
        </Button>
      ),
      cell: ({ row }: { row: Row<DailyReport> }) => row.original.date,
    },
    {
      accessorKey: "updatedAt",
      header: () => (
        <Button variant="ghost" onClick={() => handleOrderChange("updatedAt")}>
          <Calendar className="size-4" />
          <span className="mx-1">更新时间</span>
          {params.order === "asc" && params.orderBy === "updatedAt" && (
            <ArrowUpNarrowWide className="size-4" />
          )}
          {params.order === "desc" && params.orderBy === "updatedAt" && (
            <ArrowDownNarrowWide className="size-4" />
          )}
        </Button>
      ),
      cell: ({ row }: { row: Row<DailyReport> }) =>
        toSlashDateString(row.original.updatedAt),
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<DailyReport> }) => (
        <div className="flex items-center gap-2">
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
            href={`${PATHS.SITE_DAILY_REPORTS}?date=${row.original.date}&reportType=${row.original.reportType}`}
            target="_blank"
            rel="noreferrer"
          >
            <Eye className="size-4" />
          </Link>
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleGoToEdit(row.original.id)}
          >
            <Pen className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[PATHS.ADMIN_HOME, PATHS.ADMIN_DAILY_REPORTS]}
        />
      }
    >
      <div className="future-glass mb-4 grid grid-cols-1 items-end gap-4 rounded-2xl p-4 md:grid-cols-2 xl:grid-cols-5">
        <Input
          placeholder="请输入标题"
          value={inputParams.title}
          onChange={(event) => updateInputParams({ title: event.target.value })}
          onKeyUp={(event) => {
            if (event.key === "Enter") handleSearch();
          }}
        />
        <Input
          placeholder="日报类型，例如 earth-pulse"
          value={inputParams.reportType}
          onChange={(event) =>
            updateInputParams({ reportType: event.target.value })
          }
          onKeyUp={(event) => {
            if (event.key === "Enter") handleSearch();
          }}
        />
        <Input
          type="date"
          value={inputParams.date}
          onChange={(event) => updateInputParams({ date: event.target.value })}
        />
        <Select
          onValueChange={(value: PUBLISHED_ENUM) =>
            updateInputParams({ published: value })
          }
          value={inputParams.published}
        >
          <SelectTrigger
            className={cn({
              "text-muted-foreground": isUndefined(inputParams.published),
            })}
          >
            <SelectValue placeholder="请选择发布状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PUBLISHED_ENUM.ALL}>
              {PUBLISHED_LABEL_MAP[PUBLISHED_ENUM.ALL]}
            </SelectItem>
            <SelectItem value={PUBLISHED_ENUM.PUBLISHED}>
              {PUBLISHED_LABEL_MAP[PUBLISHED_ENUM.PUBLISHED]}
            </SelectItem>
            <SelectItem value={PUBLISHED_ENUM.NO_PUBLISHED}>
              {PUBLISHED_LABEL_MAP[PUBLISHED_ENUM.NO_PUBLISHED]}
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSearch}>
            <Search className="mr-2 size-4" />
            搜索
          </Button>
          <Button onClick={handleReset}>
            <RotateCw className="mr-2 size-4" />
            重置
          </Button>
        </div>
      </div>

      <div className="pb-4">
        <SearchByTags tags={tags} params={params} updateParams={updateParams} />
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={getDailyReportsQuery.data?.total}
        loading={getDailyReportsQuery.loading}
        params={{ ...params }}
        updateParams={updateParams}
        noResult={
          <div className="grid place-content-center gap-4 py-16">
            <IllustrationNoContent />
            <p>暂无日报</p>
          </div>
        }
      />
    </AdminContentLayout>
  );

  function handleSearch() {
    updateParams({
      title: inputParams.title,
      reportType: inputParams.reportType,
      date: inputParams.date,
      published: inputParams.published,
      tags: params.tags,
      pageIndex: DEFAULT_PAGE_INDEX,
    });
  }

  function handleReset() {
    updateInputParams({
      title: "",
      reportType: "",
      date: "",
      published: undefined,
      tags: undefined,
    });
    updateParams({
      title: "",
      reportType: "",
      date: "",
      published: undefined,
      tags: undefined,
      pageIndex: DEFAULT_PAGE_INDEX,
      order: "desc",
      orderBy: "date",
    });
  }

  function handleOrderChange(orderBy: GetDailyReportsDTO["orderBy"]) {
    updateParams((prev) => {
      if (prev.orderBy !== orderBy) {
        return { orderBy, order: "asc" };
      }

      if (prev.order === "desc") {
        return { orderBy: undefined, order: undefined };
      }

      return { order: prev.order === "asc" ? "desc" : "asc" };
    });
  }

  function handleGoToEdit(id: string) {
    router.push(`${PATHS.ADMIN_DAILY_REPORT_EDIT}/${id}`);
  }
};
