"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MenuIcon, UserCog } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { PATHS, SLOGAN, WEBSITE } from "@/constants";
import { SignOutDialog } from "@/features/auth";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

import { navItems } from "./config";

export const MobileNav = () => {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { user, isAuthenticated } = useAuth();
  const [signOutOpen, setSignOutOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="菜单"
          className={cn(
            "border-[var(--future-line)] bg-white/[0.04] text-[var(--future-ink)] sm:hidden",
          )}
        >
          <MenuIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="border-[var(--future-line)] text-[var(--future-ink)]"
      >
        <SheetHeader>
          <SheetTitle className="font-mono text-sm uppercase tracking-[0.28em]">
            {WEBSITE}
          </SheetTitle>
          <SheetDescription className="future-muted">{SLOGAN}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 pt-8">
          {navItems.map((el) => (
            <div key={el.link}>
              <Link
                href={el.link}
                className={cn(
                  buttonVariants({
                    variant: pathname === el.link ? "default" : "ghost",
                  }),
                  "text-md flex w-full items-center gap-2 rounded-full px-4 py-2 !justify-start",
                  pathname === el.link
                    ? "bg-[var(--future-accent)] text-white hover:bg-[var(--future-accent)]"
                    : "text-[var(--future-muted)] hover:bg-white/[0.06] hover:text-[var(--future-ink)]",
                )}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {el.label}
              </Link>
            </div>
          ))}
          {/* 后台管理/用户菜单 */}
          <div className="mt-4 border-t border-[var(--future-line)] pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {isAuthenticated ? (
                  <Avatar
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "cursor-pointer border-[var(--future-line)] bg-white/[0.04]",
                    )}
                  >
                    <AvatarImage
                      src={user?.image ?? ""}
                      className="!size-6 rounded-[8px]"
                      alt={user?.name ?? "U"}
                    />
                    <AvatarFallback className="line-clamp-1 size-6 text-ellipsis rounded-[8px]">
                      {user?.name ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="后台管理"
                    className="border-[var(--future-line)] bg-white/[0.04] text-[var(--future-ink)]"
                  >
                    <UserCog className="size-4" />
                  </Button>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isAuthenticated ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={PATHS.AUTH_SIGN_IN}>登录</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={PATHS.AUTH_SIGN_UP}>注册</Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel className="cursor-pointer"></DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={PATHS.ADMIN_HOME}>后台管理</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/profile">个人资料</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setSignOutOpen(true)}
                      className="cursor-pointer"
                    >
                      退出登录
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <SignOutDialog open={signOutOpen} setOpen={setSignOutOpen} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
