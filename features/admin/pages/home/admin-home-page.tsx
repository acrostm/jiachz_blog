import React from "react";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";
import { cn, sayHi } from "@/lib/utils";

import { AdminContentLayout } from "../../components";

export const AdminHomePage = () => {
  const guessList: Array<{ label: string; link: string }> = [
    { label: "创建标签", link: PATHS.ADMIN_TAG },
    { label: "创建博客", link: PATHS.ADMIN_BLOG },
    { label: "创建片段", link: PATHS.ADMIN_SNIPPET },
    { label: "创建笔记", link: PATHS.ADMIN_NOTE },
  ];

  return (
    <AdminContentLayout
      breadcrumb={<PageBreadcrumb breadcrumbList={[PATHS.ADMIN_HOME]} />}
    >
      <div className="mt-[10vh] grid place-content-center gap-4 px-4 lg:mt-[18vh]">
        <h2 className="text-center text-xl font-medium lg:text-3xl">
          {sayHi()} 欢迎使用后台管理系统
        </h2>
        <p className="text-center text-base text-muted-foreground lg:text-lg">
          你可能想 🤔
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-0 sm:space-x-4">
          {guessList.map((el) => (
            <Link
              key={el.link}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full sm:w-auto",
              )}
              href={el.link}
            >
              {el.label}
            </Link>
          ))}
        </div>
      </div>
    </AdminContentLayout>
  );
};
