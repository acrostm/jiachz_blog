"use server";

import { type Prisma } from "@prisma/client";

import { ERROR_NO_PERMISSION, PUBLISHED_MAP } from "@/constants";
import { noPermission } from "@/features/user";
import { prisma } from "@/lib/prisma";
import { getSkip } from "@/utils";
import { getCurrentUserId, logNoteActivity } from "@/lib/utils/activity-logger-helper";

import {
  type CreateNoteDTO,
  type GetNotesDTO,
  type UpdateNoteDTO,
  createNoteSchema,
  getNotesSchema,
  updateNoteSchema,
} from "../types";

export const isNoteExistByID = async (id: string): Promise<boolean> => {
  const isExist = await prisma.note.findUnique({ where: { id } });

  return Boolean(isExist);
};

export const getNotes = async (params: GetNotesDTO) => {
  const result = await getNotesSchema.safeParseAsync(params);

  if (!result.success) {
    const error = result.error.format()._errors?.join(";");
    throw new Error(error);
  }

  const cond: Prisma.NoteWhereInput = {};
  if (result.data.published) {
    cond.published = PUBLISHED_MAP[result.data.published];
  }
  if (result.data.body?.trim()) {
    cond.body = { contains: result.data.body.trim() };
  }
  if (result.data.tags?.length) {
    cond.tags = { some: { id: { in: result.data.tags } } };
  }

  const sort = result.data.orderBy
    ? {
        [result.data.orderBy]: result.data.order,
      }
    : undefined;

  const total = await prisma.note.count({ where: cond });
  const notes = await prisma.note.findMany({
    include: {
      tags: true,
    },
    orderBy: sort,
    where: cond,
    take: result.data.pageSize,
    skip: getSkip(result.data.pageIndex, result.data.pageSize),
  });

  return { notes, total };
};

export const getAllNotes = async () => {
  const total = await prisma.note.count({});
  const notes = await prisma.note.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      tags: true,
    },
  });

  return { notes, total };
};

export const getNoteByID = async (id: string) => {
  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      tags: true,
    },
  });

  return { note };
};

export const deleteNoteByID = async (id: string) => {
  if (await noPermission()) {
    throw ERROR_NO_PERMISSION;
  }

  const userId = await getCurrentUserId();

  try {
    const note = await prisma.note.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!note) {
      await logNoteActivity(
        userId,
        "NOTE_DELETE",
        "FAILED",
        id,
        undefined,
        "笔记不存在"
      );
      throw new Error("Note不存在");
    }

    await prisma.note.delete({
      where: {
        id,
      },
    });

    // 记录删除成功日志
    await logNoteActivity(
      userId,
      "NOTE_DELETE",
      "SUCCESS",
      id,
      {
        action: "delete",
        previousValue: {
          bodyLength: note.body.length,
          published: note.published,
          tagCount: note.tags.length,
        },
      }
    );
  } catch (error) {
    // 记录删除失败日志
    await logNoteActivity(
      userId,
      "NOTE_DELETE",
      "FAILED",
      id,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

export const createNote = async (params: CreateNoteDTO) => {
  if (await noPermission()) {
    return {
      success: false,
      error: "权限不足，仅管理员和已验证用户可以创建笔记",
    };
  }

  const userId = await getCurrentUserId();

  try {
    const { body, published, tags } = await createNoteSchema.parseAsync(params);

    const newNote = await prisma.note.create({
      data: {
        body,
        published,
        tags: {
          connect: tags?.map((tagID) => ({ id: tagID })) || [],
        },
      },
    });

    // 记录创建成功日志
    await logNoteActivity(
      userId,
      "NOTE_CREATE",
      "SUCCESS",
      newNote.id,
      {
        action: "create",
        newValue: {
          bodyLength: body.length,
          published,
          tagCount: tags?.length || 0,
        },
      }
    );

    return { success: true };
  } catch (error) {
    // 记录创建失败日志
    await logNoteActivity(
      userId,
      "NOTE_CREATE",
      "FAILED",
      "unknown",
      undefined,
      error instanceof Error ? error.message : "创建笔记失败，请重试"
    );
    return { success: false, error: "创建笔记失败，请重试" };
  }
};

export const toggleNotePublished = async (id: string) => {
  if (await noPermission()) {
    throw ERROR_NO_PERMISSION;
  }

  const userId = await getCurrentUserId();

  try {
    const note = await prisma.note.findUnique({
      where: {
        id,
      },
    });

    if (!note) {
      const activityType = note?.published ? "NOTE_UNPUBLISH" : "NOTE_PUBLISH";
      await logNoteActivity(
        userId,
        activityType as "NOTE_PUBLISH" | "NOTE_UNPUBLISH",
        "FAILED",
        id,
        undefined,
        "笔记不存在"
      );
      throw new Error("笔记不存在");
    }

    const newPublishedState = !note.published;

    await prisma.note.update({
      data: {
        published: newPublishedState,
      },
      where: {
        id,
      },
    });

    // 记录发布状态切换成功日志
    const activityType = newPublishedState ? "NOTE_PUBLISH" : "NOTE_UNPUBLISH";
    await logNoteActivity(
      userId,
      activityType,
      "SUCCESS",
      id,
      {
        action: activityType.toLowerCase().replace("note_", ""),
        previousValue: { published: note.published },
        newValue: { published: newPublishedState },
      }
    );
  } catch (error) {
    // 记录切换失败日志
    const activityType = "NOTE_PUBLISH"; // 默认值，因为无法确定原始状态
    await logNoteActivity(
      userId,
      activityType,
      "FAILED",
      id,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

export const updateNote = async (params: UpdateNoteDTO) => {
  if (await noPermission()) {
    return {
      success: false,
      error: "权限不足，仅管理员和已验证用户可以编辑笔记",
    };
  }

  const userId = await getCurrentUserId();
  const result = await updateNoteSchema.safeParseAsync(params);

  if (!result.success) {
    const error = result.error.format()._errors?.join(";");
    return { success: false, error };
  }

  const { id, body, published, tags } = result.data;

  const note = await prisma.note.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!note) {
    await logNoteActivity(
      userId,
      "NOTE_UPDATE",
      "FAILED",
      id,
      undefined,
      "笔记不存在"
    );
    return { success: false, error: "Note不存在" };
  }

  try {
    const noteTagIDs = note.tags.map(({ id }) => id);
    const connectTags = tags
      ?.filter((tagID) => !noteTagIDs.includes(tagID))
      ?.map((id) => ({ id }));
    const disconnectTags = note.tags
      .filter(({ id }) => !tags?.includes(id))
      .map(({ id }) => ({ id }));

    await prisma.note.update({
      where: { id },
      data: {
        body,
        published,
        tags: {
          connect: connectTags?.length ? connectTags : undefined,
          disconnect: disconnectTags?.length ? disconnectTags : undefined,
        },
      },
    });

    // 分析变更内容
    const changes: string[] = [];
    if (body !== note.body) changes.push("内容");
    if (published !== note.published) {
      changes.push(published ? "发布状态" : "取消发布");
    }
    if (connectTags?.length || disconnectTags?.length) changes.push("标签");

    // 记录更新成功日志
    await logNoteActivity(
      userId,
      "NOTE_UPDATE",
      "SUCCESS",
      id,
      {
        action: "update",
        previousValue: {
          bodyLength: note.body.length,
          published: note.published,
          tagCount: note.tags.length,
        },
        newValue: {
          bodyLength: body.length,
          published,
          tagCount: tags?.length || 0,
        },
        changes,
      }
    );

    return { success: true };
  } catch (error) {
    // 记录更新失败日志
    await logNoteActivity(
      userId,
      "NOTE_UPDATE",
      "FAILED",
      id,
      undefined,
      error instanceof Error ? error.message : "更新笔记失败，请重试"
    );
    return { success: false, error: "更新笔记失败，请重试" };
  }
};
