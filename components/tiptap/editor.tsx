"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import asciidoc from "highlight.js/lib/languages/asciidoc";
import dart from "highlight.js/lib/languages/dart";
import nginx from "highlight.js/lib/languages/nginx";
import { Markdown } from "tiptap-markdown";
import type { EditorOptions } from "@tiptap/core";

const lowlight = createLowlight(common);
lowlight.register({ asciidoc });
lowlight.register({ dart });
lowlight.register({ nginx });

export type TiptapEditorProps = {
  body?: string;
  setContent: (body: string) => void;
  editorProps?: EditorOptions["editorProps"];
};

export const TiptapEditor = ({ body, setContent, editorProps }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: "请输入内容..." }),
      Markdown.configure({ html: false, transformCopiedText: true, transformPastedText: true }),
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
