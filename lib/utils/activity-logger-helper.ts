/**
 * 活动日志记录辅助函数
 */
import {
  type ActivityStatus,
  type ActivityType,
  type ResourceType,
} from "@prisma/client";

import { activityLogger } from "@/lib/activity-logger";
import { auth } from "@/lib/auth";
import type { ActionDetails } from "@/lib/types/activity-log";

/**
 * 获取当前登录用户ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * 安全记录活动日志的包装函数
 */
export async function safeLogActivity(
  userId: string | null,
  activityType: ActivityType,
  status: ActivityStatus,
  options?: {
    resourceType?: ResourceType;
    resourceId?: string;
    resourceTitle?: string;
    actionDetails?: ActionDetails;
    metadata?: Record<string, any>;
    errorMessage?: string;
    errorCode?: string;
  },
): Promise<void> {
  if (!userId) {
    console.warn(`Cannot log activity ${activityType}: no user ID provided`);
    return;
  }

  try {
    await activityLogger.logActivity({
      userId,
      activityType,
      activityStatus: status,
      resourceType: options?.resourceType,
      resourceId: options?.resourceId,
      resourceTitle: options?.resourceTitle,
      actionDetails: options?.actionDetails,
      metadata: options?.metadata,
      errorMessage: options?.errorMessage,
      errorCode: options?.errorCode,
    });
  } catch (error) {
    console.error(`Failed to log activity ${activityType}:`, error);
  }
}

/**
 * 记录博客相关活动的便捷函数
 */
export async function logBlogActivity(
  userId: string | null,
  activityType:
    | "BLOG_CREATE"
    | "BLOG_UPDATE"
    | "BLOG_DELETE"
    | "BLOG_PUBLISH"
    | "BLOG_UNPUBLISH",
  status: ActivityStatus,
  blogId: string,
  blogTitle?: string,
  actionDetails?: ActionDetails,
  errorMessage?: string,
): Promise<void> {
  await safeLogActivity(userId, activityType, status, {
    resourceType: "BLOG",
    resourceId: blogId,
    resourceTitle: blogTitle,
    actionDetails,
    errorMessage,
  });
}

/**
 * 记录笔记相关活动的便捷函数
 */
export async function logNoteActivity(
  userId: string | null,
  activityType:
    | "NOTE_CREATE"
    | "NOTE_UPDATE"
    | "NOTE_DELETE"
    | "NOTE_PUBLISH"
    | "NOTE_UNPUBLISH",
  status: ActivityStatus,
  noteId: string,
  actionDetails?: ActionDetails,
  errorMessage?: string,
): Promise<void> {
  await safeLogActivity(userId, activityType, status, {
    resourceType: "NOTE",
    resourceId: noteId,
    actionDetails,
    errorMessage,
  });
}

/**
 * 记录留言相关活动的便捷函数
 */
export async function logMessageActivity(
  userId: string | null,
  activityType: "MESSAGE_SEND" | "MESSAGE_DELETE",
  status: ActivityStatus,
  messageId: string,
  metadata?: Record<string, any>,
  errorMessage?: string,
): Promise<void> {
  await safeLogActivity(userId, activityType, status, {
    resourceType: "MESSAGE",
    resourceId: messageId,
    metadata,
    errorMessage,
  });
}

/**
 * 记录标签相关活动的便捷函数
 */
export async function logTagActivity(
  userId: string | null,
  activityType: "TAG_CREATE" | "TAG_UPDATE" | "TAG_DELETE",
  status: ActivityStatus,
  tagId: string,
  tagName?: string,
  actionDetails?: ActionDetails,
  errorMessage?: string,
): Promise<void> {
  await safeLogActivity(userId, activityType, status, {
    resourceType: "TAG",
    resourceId: tagId,
    resourceTitle: tagName,
    actionDetails,
    errorMessage,
  });
}

/**
 * 记录文件相关活动的便捷函数
 */
export async function logFileActivity(
  userId: string | null,
  activityType: "FILE_UPLOAD" | "FILE_DELETE",
  status: ActivityStatus,
  fileName: string,
  metadata?: Record<string, any>,
  errorMessage?: string,
): Promise<void> {
  await safeLogActivity(userId, activityType, status, {
    resourceType: "FILE",
    resourceId: fileName,
    resourceTitle: fileName,
    metadata,
    errorMessage,
  });
}

/**
 * 记录管理员相关活动的便捷函数
 */
export async function logAdminActivity(
  userId: string | null,
  activityType: "ADMIN_ACCESS" | "USER_MANAGE" | "SYSTEM_CONFIG",
  status: ActivityStatus,
  actionDetails?: ActionDetails,
  metadata?: Record<string, any>,
  errorMessage?: string,
): Promise<void> {
  await safeLogActivity(userId, activityType, status, {
    resourceType: "SYSTEM",
    actionDetails,
    metadata,
    errorMessage,
  });
}
