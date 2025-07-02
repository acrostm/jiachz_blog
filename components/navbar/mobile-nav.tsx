"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ChevronDown,
  ChevronRight,
  EggFried,
  MenuIcon,
  UserCog,
} from "lucide-react";

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

import { IconLogoUmami } from "@/components/icons";

import { PATHS, SLOGAN, WEBSITE } from "@/constants";
import { SignOutDialog } from "@/features/auth";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

import { navItems } from "./config";

export const MobileNav = () => {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [subMenuOpen, setSubMenuOpen] = React.useState(false);
  const { user, isAuthenticated } = useAuth();
  const [signOutOpen, setSignOutOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="菜单"
          className={cn("sm:hidden")}
        >
          <MenuIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>{WEBSITE}</SheetTitle>
          <SheetDescription>{SLOGAN}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 pt-8">
          {navItems.map((el) => (
            <div key={el.link}>
              {el.external ? (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-md px-4 py-2 flex gap-2 items-center !justify-between w-full",
                      pathname.startsWith(el.link) && "bg-white text-black",
                    )}
                    onClick={() => setSubMenuOpen(!subMenuOpen)}
                  >
                    {el.label}
                    {subMenuOpen ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </Button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      subMenuOpen
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0",
                    )}
                  >
                    <div
                      className={cn(
                        "ml-4 transition-all duration-300 ease-in-out",
                        subMenuOpen ? "translate-y-0" : "-translate-y-full",
                      )}
                    >
                      <Link
                        href={`https://kuma.jiachz.com/status/1`}
                        target={"_blank"}
                        className={cn(
                          buttonVariants({
                            variant:
                              pathname ===
                              `${el.link.toLowerCase().replace(" ", "-")}`
                                ? "default"
                                : "ghost",
                          }),
                          "text-md px-4 py-2 flex gap-2 items-center !justify-start w-full",
                        )}
                        onClick={() => {
                          setOpen(false);
                          setSubMenuOpen(false);
                        }}
                      >
                        <EggFried
                          color="#8bdb99"
                          width={16}
                          height={16}
                          className={"mr-2"}
                        />
                        Uptime Kuma
                      </Link>
                      <Link
                        href={`https://umami.jiachz.com/share/nqldEpCopR9BMfLj/jiachz.com`}
                        target={"_blank"}
                        className={cn(
                          buttonVariants({
                            variant:
                              pathname ===
                              `${el.link.toLowerCase().replace(" ", "-")}`
                                ? "default"
                                : "ghost",
                          }),
                          "text-md px-4 py-2 flex gap-2 items-center !justify-start w-full",
                        )}
                        onClick={() => {
                          setOpen(false);
                          setSubMenuOpen(false);
                        }}
                      >
                        <IconLogoUmami className="mr-2 size-4" />
                        Umami
                      </Link>
                      <Link
                        href={`/coming-soon`}
                        className={cn(
                          buttonVariants({
                            variant:
                              pathname ===
                              `${el.link.toLowerCase().replace(" ", "-")}`
                                ? "default"
                                : "ghost",
                          }),
                          "text-md px-4 py-2 flex gap-2 items-center !justify-start w-full",
                        )}
                        onClick={() => {
                          setOpen(false);
                        }}
                      >
                        Project 2
                      </Link>
                      <Link
                        href={`/coming-soon`}
                        className={cn(
                          buttonVariants({
                            variant:
                              pathname ===
                              `${el.link.toLowerCase().replace(" ", "-")}`
                                ? "default"
                                : "ghost",
                          }),
                          "text-md px-4 py-2 flex gap-2 items-center !justify-start w-full",
                        )}
                        onClick={() => {
                          setOpen(false);
                        }}
                      >
                        Project 3
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href={el.link}
                  className={cn(
                    buttonVariants({
                      variant: pathname === el.link ? "default" : "ghost",
                    }),
                    "text-md px-4 py-2 flex gap-2 items-center !justify-start w-full",
                  )}
                  onClick={() => {
                    setOpen(false);
                    setSubMenuOpen(false);
                  }}
                >
                  {el.label}
                </Link>
              )}
            </div>
          ))}
          {/* 后台管理/用户菜单 */}
          <div className="mt-4 border-t pt-4">
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
