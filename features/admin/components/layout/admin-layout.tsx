"use client";

import React from "react";

import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PanelLeftClose, PanelRightClose } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";

import { Logo } from "@/components/logo";

import { NICKNAME, PATHS } from "@/constants";
import { adminNavItems } from "@/features/admin";
import { cn } from "@/lib/utils";

export const AdminLayout = ({ children }: React.PropsWithChildren) => {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(true);

  return (
    <SessionProvider>
      <div className="relative flex min-h-screen w-full bg-transparent">
        <aside
          className={cn(
            "future-glass-strong hidden lg:flex flex-col rounded-r-[1.75rem] border-r transition-all",
            open ? "w-36" : "w-14",
          )}
        >
          <Link
            href={PATHS.ADMIN_HOME}
            className={cn(
              "hidden lg:flex mt-[10vh] mb-[5vh] justify-center items-center whitespace-nowrap",
            )}
            aria-label={NICKNAME}
          >
            <span className="grid size-9 place-items-center rounded-full border border-[var(--future-line)] bg-white/10">
              <Logo className="size-8" />
            </span>
            {open && (
              <span className="ml-2 text-base font-semibold text-[var(--future-ink)]">
                后台管理
              </span>
            )}
          </Link>
          <nav
            className={cn(
              "h-full flex flex-col items-center gap-4 py-5",
              open ? "px-4" : "px-2",
            )}
          >
            {adminNavItems.map((el) => (
              <Link
                key={el.link}
                href={el.link}
                className={cn(
                  buttonVariants({
                    variant: el.link === pathname ? "default" : "ghost",
                    size: open ? "default" : "icon",
                  }),
                  "!w-full transition-all",
                )}
              >
                {el.icon}
                {open && <span className="ml-4 text-sm">{el.label}</span>}
              </Link>
            ))}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-5">
            <Button size={"icon"} variant={"outline"}>
              {open ? (
                <PanelLeftClose
                  className="size-5"
                  onClick={() => setOpen(false)}
                />
              ) : (
                <PanelRightClose
                  className="size-5"
                  onClick={() => setOpen(true)}
                />
              )}
            </Button>
          </nav>
        </aside>

        {children}
      </div>
    </SessionProvider>
  );
};
