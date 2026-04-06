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
        "w-full sticky top-0 backdrop-blur transition-[background-color,border-width] border-x-0 flex justify-center z-10",
        (scroll?.top ?? 0) > 60 && "bg-background/50 border-b border-border/50",
      )}
    >
      <div className="flex h-16 w-full items-center p-4 sm:p-8 md:max-w-screen-md 2xl:max-w-screen-xl">
        <NextLink
          href={PATHS.SITE_HOME}
          className={cn("mr-4 hidden sm:flex")}
          aria-label={NICKNAME}
        >
          <Logo />
          <span className="ml-2 text-base font-semibold text-primary">
            {WEBSITE}
          </span>
        </NextLink>
        <div className="mr-8 hidden h-16 flex-1 items-center justify-end text-base font-medium sm:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((el) => (
                <NavigationMenuItem key={el.link}>
                  <Link
                    href={el.link}
                    className={cn(
                      "font-normal text-sm text-muted-foreground transition-colors px-3 py-2 rounded-md",
                      "hover:font-semibold hover:text-primary",
                      "bg-transparent hover:bg-transparent focus:bg-transparent",
                      pathname === el.link && "font-semibold text-primary",
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
            <Button variant="outline" size={"icon"} aria-label="Github Icon">
              <IconBrandGithub className="text-base" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isAuthenticated ? (
                <Avatar
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "cursor-pointer",
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
                <Button variant="outline" size="icon" aria-label="后台管理">
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
