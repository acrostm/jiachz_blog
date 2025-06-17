"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ChangeNameForm } from "./change-name-form";

type Props = {
  userId: string;
  defaultName: string;
};

export const ChangeNameDialog = ({ userId, defaultName }: Props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>
          修改用户名
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改用户名</DialogTitle>
        </DialogHeader>
        <ChangeNameForm userId={userId} defaultName={defaultName} />
      </DialogContent>
    </Dialog>
  );
};
