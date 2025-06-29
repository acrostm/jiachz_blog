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
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import {
  IconBrandGithub,
  IconLogoKuma,
  IconLogoUmami,
} from "@/components/icons";

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
                  {el.external ? (
                    <>
                      <NavigationMenuTrigger
                        className={cn(
                          "font-normal text-sm text-muted-foreground transition-colors",
                          "hover:font-semibold hover:text-primary",
                          "bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent",
                          pathname.startsWith(el.link) &&
                            "font-semibold text-primary",
                        )}
                      >
                        {el.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                          <li className="row-span-3">
                            <NavigationMenuLink asChild>
                              <Link
                                className="flex size-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                href={`https://kuma.jiachz.com/status/1`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <IconLogoKuma className="size-20" />
                                <div className="mb-2 mt-4 text-lg font-medium">
                                  Uptime Kuma
                                </div>
                                <p className="text-sm leading-tight text-muted-foreground">
                                  服务监控
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <LabItem
                            href={`https://umami.jiachz.com/share/nqldEpCopR9BMfLj/jiachz.com`}
                            target="_blank"
                            title={
                              <div className="flex items-center">
                                <IconLogoUmami className="mr-2 size-4" />
                                <span>Umami</span>
                              </div>
                            }
                          >
                            流量监控
                          </LabItem>
                          <LabItem href="/chat" title="聊天室">
                            简易聊天室
                          </LabItem>
                          <LabItem href={el.link} title="Project 3">
                            Description of Project 3 in the lab.
                          </LabItem>
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
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
                  )}
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
                    <Link href="/coming-soon">个人资料</Link>
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

const LabItem = React.forwardRef<
  React.ElementRef<"a">,
  Omit<React.ComponentPropsWithoutRef<"a">, "title"> & {
    title: React.ReactNode;
  }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
            "hover:text-accent-foreground focus:text-accent-foreground",
            "bg-transparent hover:bg-transparent focus:bg-transparent",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
LabItem.displayName = "LabItem";
