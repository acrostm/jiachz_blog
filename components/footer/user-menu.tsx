"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutDialog } from "@/features/auth";
import { PATHS, PLACEHOLDER_TEXT } from "@/constants";
import { cn } from "@/lib/utils";

interface FooterUserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const FooterUserMenu = ({ user }: FooterUserMenuProps) => {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="absolute right-4 bottom-2 flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "cursor-pointer",
            )}
          >
            <AvatarImage
              src={user.image ?? ""}
              className="!size-6 rounded-[8px]"
              alt={user.name ?? PLACEHOLDER_TEXT}
            />
            <AvatarFallback className="line-clamp-1 size-6 text-ellipsis rounded-[8px]">
              {user.name ?? PLACEHOLDER_TEXT}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="cursor-pointer">
            我的账号
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push(PATHS.ADMIN_PROFILE)}
          >
            个人信息
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setOpen(true)}
          >
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="text-sm">{user.name ?? PLACEHOLDER_TEXT}</span>
      <SignOutDialog open={open} setOpen={setOpen} />
    </div>
  );
};
