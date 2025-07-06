"use client";

import React, { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import { Trash } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import GradientText from "@/components/ui/gradient-text";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import { isAdmin } from "@/lib/utils";

// 你需要先安装 frimousse 依赖，并引入 EmojiPicker 组件
// import { EmojiPicker } from "frimousse";

// 临时 emoji picker 占位
const EmojiPicker = ({ onSelect }: { onSelect: (emoji: string) => void }) => (
  <div className="flex flex-wrap gap-1 p-2">
    {[
      "😀",
      "😂",
      "😍",
      "🥰",
      "👍",
      "🎉",
      "😎",
      "🤔",
      "😭",
      "😡",
      "😱",
      "👏",
      "🙏",
      "💡",
      "🔥",
      "💯",
      "👀",
      "👋",
    ].map((e) => (
      <button key={e} className="text-2xl" onClick={() => onSelect(e)}>
        {e}
      </button>
    ))}
  </div>
);

interface Message {
  id: string;
  content: string;
  createdAt: string;
  userAgent: string;
  ip: string;
  isLogin: boolean;
  userId?: string;
  userInfo?: { name?: string; image?: string; email?: string };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/message-board")
      .then((res) => res.json() as Promise<{ messages?: Message[] }>)
      .then((data) => setMessages(data.messages ?? []));
  }, []);

  const handleSend = async () => {
    if (!content.trim()) return;
    setLoading(true);
    const res = await fetch("/api/message-board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setLoading(false);
    if (res.ok) {
      setContent("");
      const data = (await res.json()) as { message: Message };
      setMessages([data.message, ...messages]);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/message-board?id=${deleteId}`, { method: "DELETE" });
    setMessages(messages.filter((msg) => msg.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <Card className="space-y-2 p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的留言..."
          rows={3}
        />
        <div className="flex items-center gap-2">
          <Popover open={showEmoji} onOpenChange={setShowEmoji}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" type="button">
                😊
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <EmojiPicker
                onSelect={(e) => {
                  setContent(content + e);
                  setShowEmoji(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleSend} disabled={loading || !content.trim()}>
            {loading ? "发送中..." : "留言"}
          </Button>
        </div>
      </Card>
      <div className="space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground">暂无留言</div>
        )}
        {messages.map((msg) => {
          const isMsgAdmin = msg.userInfo?.email && isAdmin(msg.userInfo.email);
          return (
            <Card
              key={msg.id}
              className="group relative mb-6 rounded-2xl border border-border/60 bg-background/90 p-5 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.025] hover:border-primary/60 hover:bg-background/95 hover:shadow-2xl"
            >
              {/* 删除按钮，仅 admin 可见，右下角，hover 显示更明显 */}
              {isAdmin(session?.user?.email) && (
                <button
                  className="absolute bottom-3 right-3 text-red-500 opacity-80 transition-opacity hover:text-red-700 group-hover:opacity-100"
                  title="删除留言"
                  onClick={() => handleDelete(msg.id)}
                >
                  <Trash className="size-5" />
                </button>
              )}
              <div className="mb-2 flex items-center gap-3">
                {msg.userInfo?.image ? (
                  <img
                    src={msg.userInfo.image}
                    alt="avatar"
                    className="size-9 rounded-full border border-border bg-muted object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full border border-border bg-muted text-lg font-bold shadow-sm">
                    {msg.userInfo?.name?.[0] ?? (msg.isLogin ? "U" : "A")}
                  </div>
                )}
                <span className="text-base font-semibold text-primary">
                  {isMsgAdmin ? (
                    <GradientText
                      colors={["#ffaa40", "#9c40ff", "#ffaa40"]}
                      animationSpeed={1}
                      className="inline-block"
                    >
                      {msg.userInfo?.name}
                    </GradientText>
                  ) : (
                    (msg.userInfo?.name ??
                    (msg.isLogin ? "已登录用户" : "匿名用户"))
                  )}
                </span>
                {/* 用户身份 tag */}
                {isMsgAdmin ? (
                  <span
                    className="ml-2 inline-block rounded-full border border-destructive bg-transparent px-2 py-0.5 text-xs font-medium text-destructive transition-colors duration-200"
                    style={{ minWidth: 56 }}
                  >
                    管理员
                  </span>
                ) : msg.isLogin ? (
                  <span
                    className="ml-2 inline-block rounded-full border border-primary bg-transparent px-2 py-0.5 text-xs font-medium text-primary transition-colors duration-200"
                    style={{ minWidth: 56 }}
                  >
                    注册用户
                  </span>
                ) : (
                  <span
                    className="ml-2 inline-block rounded-full border border-muted-foreground bg-transparent px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors duration-200"
                    style={{ minWidth: 39 }}
                  >
                    游客
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="my-2 h-px w-full bg-border/60" />
              <pre className="whitespace-pre-wrap break-words px-1 font-sans text-[1.08rem] leading-relaxed tracking-wide text-foreground">
                {msg.content}
              </pre>
            </Card>
          );
        })}
      </div>
      {/* 删除确认弹窗 */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="max-w-sm p-8 text-center">
          <div className="mb-2 flex flex-col items-center gap-2">
            <span className="text-4xl">🗑️</span>
            <AlertDialogTitle className="mb-1 mt-2 text-xl font-bold">
              确定要删除这条留言吗？
            </AlertDialogTitle>
            <AlertDialogDescription className="mb-2 text-base text-muted-foreground">
              删除后不可恢复，请谨慎操作。
            </AlertDialogDescription>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <AlertDialogCancel className="w-28">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-28 bg-red-500 hover:bg-red-600"
            >
              确定删除
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
