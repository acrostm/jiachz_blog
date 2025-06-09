"use client";

import React from "react";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";
import { Bold, Code, Eye, EyeOff, Heading2, Italic, List, ListOrdered } from "lucide-react";
import { Markdown } from "tiptap-markdown";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TiptapViewer } from "./viewer";

const lowlight = createLowlight(all);

type MenuBarProps = {
  editor: ReturnType<typeof useEditor> | null;
  showPreview: boolean;
  togglePreview: () => void;
};

const MenuBar = ({ editor, showPreview, togglePreview }: MenuBarProps) => {
  if (!editor) return null;
  return (
    <div className="tiptap-menubar">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        data-active={editor.isActive("bold")}
        className={cn(editor.isActive("bold") && "bg-accent text-accent-foreground")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        data-active={editor.isActive("italic")}
        className={cn(editor.isActive("italic") && "bg-accent text-accent-foreground")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        data-active={editor.isActive("heading", { level: 2 })}
        className={cn(editor.isActive("heading", { level: 2 }) && "bg-accent text-accent-foreground")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        data-active={editor.isActive("bulletList")}
        className={cn(editor.isActive("bulletList") && "bg-accent text-accent-foreground")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        data-active={editor.isActive("orderedList")}
        className={cn(editor.isActive("orderedList") && "bg-accent text-accent-foreground")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        data-active={editor.isActive("codeBlock")}
        className={cn(editor.isActive("codeBlock") && "bg-accent text-accent-foreground")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={togglePreview}
      >
        {showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
};

export type TiptapEditorProps = {
  body?: string;
  setContent: (body: string) => void;
  editorProps?: Parameters<typeof useEditor>[0]["editorProps"];
};

export const TiptapEditor = ({
  body,
  setContent,
  editorProps,
}: TiptapEditorProps) => {
  const [preview, setPreview] = React.useState(false);
  const [markdown, setMarkdown] = React.useState(body ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: "请输入内容..." }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    content: body ?? "",
    editorProps,
    onUpdate({ editor }) {
      // @ts-ignore
      const md = editor.storage.markdown.getMarkdown();
      setMarkdown(md);
      setContent(md);
    },
  });

  return (
    <div className="space-y-2">
      <MenuBar
        editor={editor}
        showPreview={preview}
        togglePreview={() => setPreview((p) => !p)}
      />
      <div className={cn(preview && "grid md:grid-cols-2 gap-4")}>
        <EditorContent editor={editor} className="tiptap-editor" />
        {preview && <TiptapViewer body={markdown} />}
      </div>
    </div>
  );
};
