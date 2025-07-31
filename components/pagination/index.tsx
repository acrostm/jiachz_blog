import React from "react";

import { type SetState } from "ahooks/lib/useSetState";
import { Ellipsis } from "lucide-react";

import { PAGE_SIZE_OPTIONS } from "@/constants";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type PaginationProps = {
  total?: number;
  params: {
    pageIndex: number;
    pageSize: number;
  };
  updateParams: SetState<{
    pageIndex: number;
    pageSize: number;
  }>;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
};

export const Pagination = ({
  params,
  updateParams,
  total = 0,
  showSizeChanger,
  showQuickJumper,
}: PaginationProps) => {
  const pageCount = Math.ceil(total / params.pageSize);
  const delta = 3;

  const [quickJumpPage, setQuickJumpPage] = React.useState("");

  // Memoize pagination range to avoid unnecessary re-renders
  const paginationRange = React.useMemo(() => {
    const range = [];
    const currentPage = Number(params.pageIndex) + 1; // Convert from 0-based to 1-based

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(pageCount - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < pageCount - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (pageCount !== 1) {
      range.push(pageCount);
    }

    return range;
  }, [pageCount, params]);

  return (
    <div className="flex items-center space-x-6 py-4 lg:space-x-8">
      <div className="flex items-center space-x-2">
        {pageCount > 1 &&
          paginationRange.map((pageNumber, i) =>
            pageNumber === "..." ? (
              <Button key={i} variant="ghost" className="!cursor-not-allowed">
                <Ellipsis className="size-3" />
              </Button>
            ) : (
              <Button
                key={i}
                variant={
                  pageNumber === Number(params.pageIndex) + 1
                    ? "outline"
                    : "ghost"
                }
                onClick={() => {
                  updateParams({
                    pageIndex: Number(pageNumber) - 1,
                  });
                }}
              >
                {pageNumber}
              </Button>
            ),
          )}
        {showQuickJumper && pageCount > 1 && (
          <div className="flex items-center space-x-2">
            跳转至
            <Input
              className="mx-2 w-12"
              value={quickJumpPage}
              onChange={(e) => {
                if (Number(e.target.value?.trim())) {
                  setQuickJumpPage(`${Number(e.target.value?.trim())}`);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  updateParams({
                    pageIndex: Math.min(Number(quickJumpPage), pageCount) - 1,
                  });
                  setQuickJumpPage("");
                }
              }}
            />
            页
          </div>
        )}
        {showSizeChanger && total > 0 && (
          <div className="flex items-center space-x-2">
            <p className="whitespace-nowrap text-sm font-medium">每页条数</p>
            <Select
              value={`${params.pageSize}`}
              onValueChange={(value) => {
                updateParams({
                  pageIndex: 0,
                  pageSize: Number(value),
                });
              }}
            >
              <SelectTrigger className="h-10 w-[70px] text-muted-foreground">
                <SelectValue placeholder={params.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZE_OPTIONS.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

type PaginationInfoProps = Pick<PaginationProps, "params" | "total">;

export const PaginationInfo = ({ params, total = 0 }: PaginationInfoProps) => {
  const currentPage = params.pageIndex + 1; // Convert from 0-based to 1-based
  const startItem = params.pageIndex * params.pageSize + 1;
  const endItem = Math.min(total, currentPage * params.pageSize);

  return (
    <p>
      显示第
      <span className="mx-1 font-semibold">{startItem}</span>
      条-第
      <span className="mx-1 font-semibold">{endItem}</span>
      条，共
      <span className="mx-1 font-semibold">{total}</span>条
    </p>
  );
};
