import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const SettingsModal = ({ open, setOpen }: Props) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>

        <div className="flex space-x-4">
          <a href="/admin/user">
            <Button variant="default">用户管理</Button>
          </a>
          <a href="/coming-soon">
            <Button variant="secondary">修改密码</Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
