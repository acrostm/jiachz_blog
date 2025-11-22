import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PATHS } from "@/constants";

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <a href={PATHS.ADMIN_USER}>
            <Button variant="default" className="w-full">
              用户管理
            </Button>
          </a>
          <a href={PATHS.ADMIN_ACTIVITY_LOGS}>
            <Button variant="outline" className="w-full">
              操作日志
            </Button>
          </a>
          <a href={PATHS.ADMIN_BARK_CONFIG}>
            <Button variant="outline" className="w-full">
              Bark通知配置
            </Button>
          </a>
          <a href={PATHS.SITE_PROFILE}>
            <Button variant="secondary" className="w-full">
              修改密码
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
