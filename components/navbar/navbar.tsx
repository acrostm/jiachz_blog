"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useScroll } from "ahooks";
import { UserCog } from "lucide-react";

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
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

import { IconBrandGithub } from "@/components/icons";

import { NICKNAME, PATHS, SOURCE_CODE_GITHUB_PAGE, WEBSITE } from "@/constants";
import { SignOutDialog } from "@/features/auth";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

import { navItems } from "./config";
import { MobileNav } from "./mobile-nav";

import { Logo } from "../logo";
import { ModeToggle } from "../mode-toggle";
import { NextLink } from "../next-link";

export const Navbar = () => {
  const scroll = useScroll(() => document);
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [signOutOpen, setSignOutOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex w-full justify-center border-x-0 transition-[background-color,border-color,box-shadow] duration-300",
        "future-nav-glass border-transparent",
        (scroll?.top ?? 0) > 60 &&
          "border-[var(--future-line)] shadow-[0_18px_70px_rgb(0_0_0/0.2)]",
      )}
    >
      <div className="flex h-16 w-full items-center px-4 sm:px-8 md:max-w-screen-md 2xl:max-w-screen-xl">
        <NextLink
          href={PATHS.SITE_HOME}
          className={cn("mr-4 hidden items-center gap-3 sm:flex")}
          aria-label={NICKNAME}
        >
          <span className="grid size-9 place-items-center rounded-full border border-[var(--future-line)] bg-white/5 shadow-inner">
            <Logo />
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-[var(--future-ink)]">
            {WEBSITE}
          </span>
        </NextLink>
        <div className="mr-8 hidden h-16 flex-1 items-center justify-end text-base font-medium sm:flex">
          <NavigationMenu>
            <NavigationMenuList className="future-control-glass gap-1 rounded-full p-1">
              {navItems.map((el) => (
                <NavigationMenuItem key={el.link}>
                  <Link
                    href={el.link}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium text-[var(--future-muted)] transition-colors",
                      "hover:text-[var(--future-ink)]",
                      "bg-transparent hover:bg-white/20 focus:bg-white/20 dark:hover:bg-white/10 dark:focus:bg-white/10",
                      pathname === el.link &&
                        "bg-[var(--future-accent)]/12 text-[var(--future-ink)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]",
                    )}
                  >
                    {el.label}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <MobileNav />
        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          <ModeToggle />
          <Link
            href={SOURCE_CODE_GITHUB_PAGE}
            target="_blank"
            title={SOURCE_CODE_GITHUB_PAGE}
            aria-label={SOURCE_CODE_GITHUB_PAGE}
          >
            <Button
              variant="outline"
              size={"icon"}
              aria-label="Github Icon"
              className="border-[var(--future-line)] bg-white/[0.04] text-[var(--future-ink)] hover:bg-white/[0.08]"
            >
              <IconBrandGithub className="text-base" />
            </Button>
          </Link>
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
                  className="border-[var(--future-line)] bg-white/[0.04] text-[var(--future-ink)] hover:bg-white/[0.08]"
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
                  <DropdownMenuLabel className="cursor-pointer">
                    {user?.name ?? "U"}
                  </DropdownMenuLabel>
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
    </header>
  );
};
