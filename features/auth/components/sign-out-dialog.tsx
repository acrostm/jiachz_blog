"use client";

import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { signOutAndRedirect } from "../actions/sign-out";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const SignOutDialog = ({ open, setOpen }: Props) => {
  async function handleLogout() {
    await signOutAndRedirect();
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-sm p-8 text-center">
        <div className="mb-2 flex flex-col items-center gap-2">
          <span className="text-4xl">👋</span>
          <AlertDialogTitle className="mb-1 mt-2 text-xl font-bold">
            确定要退出登录吗？
          </AlertDialogTitle>
          <AlertDialogDescription className="mb-2 text-base text-muted-foreground">
            退出后将返回到登录页面，期待下次再见！
          </AlertDialogDescription>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <AlertDialogCancel className="w-28">取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} className="w-28">
            确定
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
