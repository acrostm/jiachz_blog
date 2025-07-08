"use client";

import { Editor, type EditorProps } from "@bytemd/react";
import zh_Hans from "bytemd/locales/zh_Hans.json";
import { toast } from "sonner";

import { uploadFile } from "@/features/upload";

import { plugins, sanitize } from "./config";

type BytemdEditorProps = {
  body?: string;
  setContent: (body: string) => void;
  editorProps?: Partial<EditorProps>;
};

export const BytemdEditor = ({
  body,
  setContent,
  editorProps,
}: BytemdEditorProps) => {
  const handleUploadImages: EditorProps["uploadImages"] = async (files) => {
    const file = files[0];
    if (!file) return [];
    const fd = new FormData();
    fd.append("file", file);

    const toastID = toast.loading("上传中");
    try {
      const { url, error } = await uploadFile(fd);
      toast.dismiss(toastID);
      if (error) {
        toast.error(error);
        return [];
      }

      if (url) {
        toast.success("上传成功");
        return [{ url, alt: file.name, title: file.name }];
      }
    } catch {
      toast.dismiss(toastID);
      toast.error("上传失败");
    }
    return [];
  };

  return (
    <Editor
      value={body ?? ""}
      plugins={plugins}
      placeholder="请输入内容..."
      sanitize={sanitize}
      onChange={(v) => setContent(v)}
      uploadImages={handleUploadImages}
      locale={zh_Hans}
      editorConfig={{
        ...editorProps,
      }}
    />
  );
};
