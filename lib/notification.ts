/**
 * Reusable notification module for Bark notifications
 * Supports various notification parameters and types
 */
import { type BarkConfigItem, getEnabledBarkConfigs } from "./bark-config";

export interface BarkNotificationOptions {
  title: string;
  body: string;
  sound?: string;
  group?: string;
  category?: string;
  icon?: string;
  url?: string;
  level?: "active" | "timeSensitive" | "passive";
  badge?: number;
  copy?: string;
  autoCopy?: "1" | "0";
  isArchive?: "1" | "0";
}

export interface NotificationTemplate {
  title: string;
  body: string;
  sound: string;
  group: string;
  category: string;
  icon: string;
}

const NOTIFICATION_TEMPLATES = {
  BUILD_SUCCESS: {
    title: "🚀 [Next Build Success] 🎉",
    body: "🎉 **Build Status:** SUCCESS ✅\n\n🕒 **Build Time:** {time}\n\n🌐 **Server IP:** {serverIp}\n\n✨ Congratulations! Your Next.js project has been successfully built! 🎊",
    sound: "shake.caf",
    group: "Blog",
    category: "服务监控",
    icon: "https://r2.jiachz.com/jiachz-light.svg",
  },
  BUILD_FAILED: {
    title: "🚨 [Next Build Failed] ❌",
    body: "⚠️ **Build Status:** FAILED ❌\n\n🕒 **Failure Time:** {time}\n\n🌐 **Server IP:** {serverIp}\n\n💥 Please check the logs and fix the issues. Good luck! 💪",
    sound: "ladder.caf",
    group: "Blog",
    category: "服务监控",
    icon: "https://r2.jiachz.com/jiachz-light.svg",
  },
  NEW_MESSAGE: {
    title: "💬 [New Message] 📝",
    body: "📝 **新留言通知**\n\n👤 **来自:** {author}\n\n💭 **内容:** {content}\n\n🕒 **时间:** {time}\n\n🌐 **IP:** {ip}",
    sound: "bell.caf",
    group: "Blog",
    category: "留言板",
    icon: "https://r2.jiachz.com/jiachz-light.svg",
  },
  NEW_USER_REGISTERED: {
    title: "🎉 [New User Registered] 👤",
    body: "🎊 **新用户注册通知**\n\n👤 **用户名:** {name}\n\n📧 **邮箱:** {email}\n\n🕒 **注册时间:** {time}\n\n🌐 **IP:** {ip}\n\n🎉 恭喜！又有新朋友加入了！",
    sound: "anticipate.caf",
    group: "Blog",
    category: "用户管理",
    icon: "https://r2.jiachz.com/jiachz-light.svg",
  },
  NEW_BLOG_CREATED: {
    title: "✍️ [New Blog Created] 📖",
    body: "📖 **新博客发布通知**\n\n📝 **标题:** {title}\n\n👤 **作者:** {author}\n\n🏷️ **状态:** {status}\n\n🕒 **创建时间:** {time}\n\n✨ 新的精彩内容已经发布！",
    sound: "multiwayinvitation.caf",
    group: "Blog",
    category: "内容管理",
    icon: "https://r2.jiachz.com/jiachz-light.svg",
  },
  OTP_CODE: {
    title: "🔐 [验证码] 🔑",
    body: "🔑 **验证码通知**\n\n📧 **邮箱:** {email}\n\n🔢 **验证码:** {code}\n\n🎯 **用途:** {type}\n\n🕒 **发送时间:** {time}\n\n⏰ **有效期:** 60秒\n\n🔐 请及时使用验证码完成验证！",
    sound: "alert.caf",
    group: "Blog",
    category: "安全验证",
    icon: "https://r2.jiachz.com/jiachz-light.svg",
  },
} as const;

const BARK_REQUEST_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (compatible; JiachzBlogBarkNotifier/1.0; +https://jiachz.com)",
};

export type NotificationTemplateType = keyof typeof NOTIFICATION_TEMPLATES;

type BarkPayload = Required<Pick<BarkNotificationOptions, "title" | "body">> &
  Partial<Omit<BarkNotificationOptions, "title" | "body">>;

const isCloudflareChallenge = (status: number, responseText: string) =>
  status === 403 &&
  (responseText.includes("Just a moment") ||
    responseText.includes("challenges.cloudflare.com") ||
    responseText.includes("__cf_chl_"));

const formatBarkErrorResponse = (status: number, responseText: string) => {
  if (isCloudflareChallenge(status, responseText)) {
    return "Cloudflare Managed Challenge blocked the Bark request.";
  }

  return responseText.slice(0, 500);
};

const createBarkGetUrl = (baseUrl: string, payload: BarkPayload): string => {
  const baseWithSlash = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(
    `${encodeURIComponent(payload.title)}/${encodeURIComponent(payload.body)}`,
    baseWithSlash,
  );

  const searchParams: Record<string, string | undefined> = {
    sound: payload.sound,
    group: payload.group,
    category: payload.category,
    icon: payload.icon,
    url: payload.url,
    level: payload.level,
    badge: payload.badge?.toString(),
    copy: payload.copy,
    autoCopy: payload.autoCopy,
    isArchive: payload.isArchive,
  };

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

class BarkNotification {
  /**
   * 向单个bark配置发送通知
   */
  private async sendToConfig(
    config: BarkConfigItem,
    options: BarkNotificationOptions,
  ): Promise<boolean> {
    try {
      const payload = {
        title: options.title,
        body: options.body,
        sound: options.sound ?? config.defaultSound,
        group: options.group ?? config.defaultGroup,
        category: options.category ?? config.defaultCategory,
        icon: options.icon ?? config.defaultIcon,
        ...(options.url && { url: options.url }),
        ...(options.level && { level: options.level }),
        ...(options.badge && { badge: options.badge }),
        ...(options.copy && { copy: options.copy }),
        ...(options.autoCopy && { autoCopy: options.autoCopy }),
        ...(options.isArchive && { isArchive: options.isArchive }),
      };

      const response = await fetch(config.url, {
        method: "POST",
        headers: BARK_REQUEST_HEADERS,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text().catch(() => "");
        console.error(
          `Failed to send notification to ${config.name}: ${response.status} ${response.statusText}`,
          formatBarkErrorResponse(response.status, responseText),
        );

        if (isCloudflareChallenge(response.status, responseText)) {
          const fallbackResponse = await fetch(
            createBarkGetUrl(config.url, payload),
            {
              method: "GET",
              headers: BARK_REQUEST_HEADERS,
            },
          );

          if (!fallbackResponse.ok) {
            const fallbackResponseText = await fallbackResponse
              .text()
              .catch(() => "");
            console.error(
              `Failed to send fallback notification to ${config.name}: ${fallbackResponse.status} ${fallbackResponse.statusText}`,
              formatBarkErrorResponse(
                fallbackResponse.status,
                fallbackResponseText,
              ),
            );
          }

          return fallbackResponse.ok;
        }
      }

      return response.ok;
    } catch (error) {
      console.error(`Failed to send notification to ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Send a notification using a predefined template
   * 向所有启用的bark配置发送通知
   */
  async sendTemplateNotification(
    templateType: NotificationTemplateType,
    variables: Record<string, string> = {},
    overrides: Partial<BarkNotificationOptions> = {},
  ): Promise<boolean> {
    const template = NOTIFICATION_TEMPLATES[templateType];

    // Replace variables in template
    let title: string = template.title;
    let body: string = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, "g"), value);
      body = body.replace(new RegExp(placeholder, "g"), value);
    });

    const options: BarkNotificationOptions = {
      title,
      body,
      sound: template.sound,
      group: template.group,
      category: template.category,
      icon: template.icon,
      ...overrides,
    };

    return this.sendNotification(options);
  }

  /**
   * Send a custom notification
   * 向所有启用的bark配置发送通知
   */
  async sendNotification(options: BarkNotificationOptions): Promise<boolean> {
    try {
      // 获取所有启用的bark配置
      const configs = await getEnabledBarkConfigs();

      if (configs.length === 0) {
        console.warn("No enabled bark configs found");
        return false;
      }

      // 向所有启用的配置发送通知
      const results = await Promise.all(
        configs.map((config) => this.sendToConfig(config, options)),
      );

      // 只要有一个成功就返回true
      return results.some((result) => result);
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  }

  /**
   * Send a quick notification with minimal parameters
   */
  async sendQuickNotification(
    title: string,
    body: string,
    options: Partial<BarkNotificationOptions> = {},
  ): Promise<boolean> {
    return this.sendNotification({
      title,
      body,
      ...options,
    });
  }
}

// Export singleton instance
export const barkNotification = new BarkNotification();

// Export class for custom instances
export { BarkNotification };

// Utility functions for common use cases
export async function notifyBuildSuccess(
  time: string,
  serverIp: string,
): Promise<boolean> {
  return barkNotification.sendTemplateNotification("BUILD_SUCCESS", {
    time,
    serverIp,
  });
}

export async function notifyBuildFailed(
  time: string,
  serverIp: string,
): Promise<boolean> {
  return barkNotification.sendTemplateNotification("BUILD_FAILED", {
    time,
    serverIp,
  });
}

export async function notifyNewMessage(
  author: string,
  content: string,
  time: string,
  ip: string,
): Promise<boolean> {
  // Truncate content if too long
  const truncatedContent =
    content.length > 100 ? content.substring(0, 100) + "..." : content;

  return barkNotification.sendTemplateNotification("NEW_MESSAGE", {
    author,
    content: truncatedContent,
    time,
    ip,
  });
}

export async function notifyNewUserRegistered(
  name: string,
  email: string,
  time: string,
  ip: string,
): Promise<boolean> {
  return barkNotification.sendTemplateNotification("NEW_USER_REGISTERED", {
    name,
    email,
    time,
    ip,
  });
}

export async function notifyNewBlogCreated(
  title: string,
  author: string,
  status: string,
  time: string,
): Promise<boolean> {
  // Truncate title if too long
  const truncatedTitle =
    title.length > 50 ? title.substring(0, 50) + "..." : title;

  return barkNotification.sendTemplateNotification("NEW_BLOG_CREATED", {
    title: truncatedTitle,
    author,
    status,
    time,
  });
}

export async function notifyOtpCode(
  email: string,
  code: string,
  type: string,
  time: string,
): Promise<boolean> {
  const typeMap: Record<string, string> = {
    "email-verification": "邮箱验证",
    "password-change": "修改密码",
  };

  return barkNotification.sendTemplateNotification("OTP_CODE", {
    email,
    code,
    type: typeMap[type] ?? type,
    time,
  });
}
