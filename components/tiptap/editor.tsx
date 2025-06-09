"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";

const lowlight = createLowlight(all);

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
    ],
    content: body ?? "",
    editorProps,
    onUpdate({ editor }) {
      // @ts-ignore
      const markdown = editor.storage.markdown.getMarkdown();
      setContent(markdown);
    },
  });

  return <EditorContent editor={editor} className="tiptap-editor" />;
};
