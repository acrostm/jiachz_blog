"use client";

import React from "react";

import Link from "next/link";

import { ArrowUpRight, MessageCircle, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { PATHS } from "@/constants";

const QUICK_REACTIONS = ["👋", "💡", "🚀", "✨", "🔥", "🧠"];
const MAX_LENGTH = 420;

type PostedMessage = {
  id: string;
  content: string;
  createdAt: string;
};

type MessageBoardResponse = {
  message?: PostedMessage;
  error?: string;
  detail?: string;
};

export const AboutMessageComposer = () => {
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [postedMessage, setPostedMessage] = React.useState<PostedMessage>();

  const trimmedContent = content.trim();
  const canSubmit = trimmedContent.length > 0 && !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/message-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmedContent }),
      });
      const payload = (await response.json()) as MessageBoardResponse;

      if (!response.ok || !payload.message) {
        throw new Error(payload.error ?? payload.detail ?? "留言发送失败");
      }

      setPostedMessage(payload.message);
      setContent("");
      toast.success("留言已同步到留言板");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "留言发送失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      data-about-reveal
      className="future-panel-strong relative isolate overflow-hidden rounded-[2rem] p-5 md:p-6"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_24%,var(--future-gold-soft),transparent_22rem),radial-gradient(circle_at_88%_12%,var(--future-cyan-soft),transparent_18rem)]" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] lg:items-center">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.06] text-[var(--future-accent)]">
              <MessageCircle className="size-5" />
            </span>
            <span className="future-label">Message Relay</span>
          </div>
          <h2 className="text-3xl font-black leading-tight text-[var(--future-ink)] md:text-4xl">
            留一句话，会直接同步到留言板
          </h2>
          <p className="future-muted mt-3 max-w-xl text-sm leading-7 md:text-base">
            About
            页只保留轻量输入体验；完整留言流、用户身份、管理员删除和通知逻辑继续由现有
            Message Board 承担。
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-[var(--future-line)] bg-white/[0.04]"
            >
              <Link href={PATHS.SITE_MESSAGES}>
                查看完整留言板
                <ArrowUpRight className="ml-2 size-4" />
              </Link>
            </Button>
            {postedMessage && (
              <span className="inline-flex min-h-10 items-center rounded-full border border-[var(--future-cyan)] bg-[var(--future-cyan-soft)] px-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--future-ink)]">
                Synced {formatMessageTime(postedMessage.createdAt)}
              </span>
            )}
          </div>
        </div>

        <form
          className="rounded-3xl border border-[var(--future-line)] bg-black/[0.08] p-4 dark:bg-black/20"
          onSubmit={handleSubmit}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--future-muted)]">
              <Sparkles className="size-4 text-[var(--future-gold)]" />
              Quick note
            </div>
            <span className="font-mono text-xs text-[var(--future-muted)]">
              {content.length}/{MAX_LENGTH}
            </span>
          </div>

          <Textarea
            value={content}
            onChange={(event) =>
              setContent(event.target.value.slice(0, MAX_LENGTH))
            }
            placeholder="写下你的想法、建议，或者只是打个招呼..."
            rows={5}
            className="min-h-[150px] resize-none rounded-2xl border-[var(--future-line)] bg-white/[0.05] text-base"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {QUICK_REACTIONS.map((reaction) => (
                <button
                  key={reaction}
                  type="button"
                  className="grid size-9 place-items-center rounded-full border border-[var(--future-line)] bg-white/[0.04] text-base transition hover:-translate-y-0.5 hover:border-[var(--future-accent)] hover:bg-white/[0.08]"
                  onClick={() =>
                    setContent((current) =>
                      `${current}${current.endsWith(" ") || current.length === 0 ? "" : " "}${reaction}`.slice(
                        0,
                        MAX_LENGTH,
                      ),
                    )
                  }
                >
                  {reaction}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="rounded-full bg-[var(--future-accent)] px-6 text-white hover:bg-[var(--future-accent)]"
            >
              {submitting ? "同步中..." : "同步留言"}
              <Send className="ml-2 size-4" />
            </Button>
          </div>

          {postedMessage && (
            <div className="mt-4 rounded-2xl border border-[var(--future-line)] bg-white/[0.04] p-3">
              <p className="future-label mb-2">Last message</p>
              <p className="future-muted line-clamp-2 text-sm leading-6">
                {postedMessage.content}
              </p>
            </div>
          )}
        </form>
      </div>
    </section>
  );
};

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "just now";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
