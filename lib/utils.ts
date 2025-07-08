import { type ClassValue, clsx } from "clsx";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";
import slugify from "slugify";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { ADMIN_EMAILS } from "@/constants";

dayjs.extend(relativeTime);

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const toSlug = (s: string) => {
  if (!s) {
    return "";
  }

  return slugify(s, {
    lower: true,
  });
};

export const copyToClipboard = (text: string) => {
  // 实测 Clipboard API 在 iPhone 上不支持，可恶！
  if (navigator.clipboard) {
    navigator.clipboard
      // 去除首尾空白字符
      .writeText(text?.trim())
      .then(() => {
        toast.success("已复制到粘贴板");
      })
      .catch((error) => {
        toast.error(error as string);
      });
  } else {
    // 以下代码来自：https://www.zhangxinxu.com/wordpress/2021/10/js-copy-paste-clipboard/
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    // 隐藏此输入框
    textarea.style.position = "fixed";
    textarea.style.clip = "rect(0 0 0 0)";
    textarea.style.top = "10px";
    // 赋值，手动去除首尾空白字符
    textarea.value = text?.trim();
    // 选中
    textarea.select();
    // 复制
    document.execCommand("copy", true);
    toast.success("已复制到粘贴板");
    // 移除输入框
    document.body.removeChild(textarea);
  }
};

export const toFromNow = (date: number | Date) => {
  return dayjs(date).locale("zh-cn").fromNow();
};

export const toSlashDateString = (date: number | Date) => {
  return dayjs(date).locale("zh-cn").format("YYYY年M月D日 dddd HH:mm:ss");
};

export const prettyDate = (date: number | Date) => {
  return dayjs(date).locale("zh-cn").format("M月 D，YYYY");
};

/* 根据当前时间显示不同的问候语 */
export const sayHi = () => {
  const hour = dayjs().hour();

  if (hour < 6) {
    return "凌晨好~";
  } else if (hour < 9) {
    return "早上好~";
  } else if (hour < 12) {
    return "上午好~";
  } else if (hour < 14) {
    return "中午好~";
  } else if (hour < 17) {
    return "下午好~";
  } else if (hour < 19) {
    return "傍晚好~";
  } else {
    return "晚上好~";
  }
};

export const prettyDateWithWeekday = (date: number | Date) => {
  return dayjs(date).locale("zh-cn").format("dddd，MMMM D YYYY");
};

export const isAdmin = (email?: string | null) => {
  if (!email || !ADMIN_EMAILS?.length) {
    return false;
  }
  return ADMIN_EMAILS.includes(email);
};

export const isBrowser = () => {
  // 代码来自：https://ahooks.js.org/zh-CN/guide/blog/ssr
  /* eslint-disable @typescript-eslint/prefer-optional-chain */
  return !!(
    typeof window !== "undefined" &&
    window.document &&
    window.document.createElement
  );
};

/**
 * 返回类似“刚刚”、“5分钟前”、“2天前”的相对时间字符串
 */
export function formatRelativeTime(dateStr?: string | Date | number): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60 * 1000) return "刚刚";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 30 * 24 * 60 * 60 * 1000)
    return `${Math.floor(diff / (24 * 3600000))}天前`;
  if (diff < 30 * 24 * 60 * 60 * 1000 * 7)
    return `${Math.floor(diff / (24 * 3600000 * 7))}周前`;
  if (diff < 365 * 24 * 60 * 60 * 1000)
    return `${Math.floor(diff / (24 * 3600000 * 30))}月前`;
  return dayjs(date).locale("zh-cn").format("YYYY年M月D日 HH:mm:ss");
}
