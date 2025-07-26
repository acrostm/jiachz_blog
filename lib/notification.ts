/**
 * Reusable notification module for Bark notifications
 * Supports various notification parameters and types
 */

export interface BarkNotificationOptions {
  title: string;
  body: string;
  key?: string;
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
} as const;

export type NotificationTemplateType = keyof typeof NOTIFICATION_TEMPLATES;

class BarkNotification {
  private readonly barkUrl: string;

  constructor(barkUrl = "https://bark.jiachz.com/9fZrbZk3hu2eLs4B24yL2M/") {
    this.barkUrl = barkUrl;
  }

  /**
   * Send a notification using a predefined template
   */
  async sendTemplateNotification(
    templateType: NotificationTemplateType,
    variables: Record<string, string> = {},
    overrides: Partial<BarkNotificationOptions> = {},
  ): Promise<boolean> {
    const template = NOTIFICATION_TEMPLATES[templateType];

    // Replace variables in template
    let title = template.title;
    let body = template.body;

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
   */
  async sendNotification(options: BarkNotificationOptions): Promise<boolean> {
    try {
      const payload = {
        title: options.title,
        body: options.body,
        key: options.key ?? "✅",
        sound: options.sound ?? "default",
        group: options.group ?? "Blog",
        category: options.category ?? "通知",
        icon: options.icon ?? "https://r2.jiachz.com/jiachz-light.svg",
        ...(options.url && { url: options.url }),
        ...(options.level && { level: options.level }),
        ...(options.badge && { badge: options.badge }),
        ...(options.copy && { copy: options.copy }),
        ...(options.autoCopy && { autoCopy: options.autoCopy }),
        ...(options.isArchive && { isArchive: options.isArchive }),
      };

      const response = await fetch(this.barkUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch {
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
