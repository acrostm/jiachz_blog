"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronDown, ChevronRight, EggFried, MenuIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { IconLogoUmami } from "@/components/icons";

import { SLOGAN, WEBSITE } from "@/constants";
import { cn } from "@/lib/utils";

import { navItems } from "./config";

export const MobileNav = () => {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [subMenuOpen, setSubMenuOpen] = React.useState(false);

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
                        href={`https://kuma.jiachzha.com/status/1`}
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
                        href={`https://umami.jiachzha.com/share/FA5STOBptMTaBn4o/jiachzha.com`}
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
