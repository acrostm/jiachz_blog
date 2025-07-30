"use server";

import { type Prisma, TagTypeEnum } from "@prisma/client";

import { ERROR_NO_PERMISSION } from "@/constants";
import { noPermission } from "@/features/user";
import { prisma } from "@/lib/prisma";
import { getSkip } from "@/utils";
import { getCurrentUserId, logTagActivity } from "@/lib/utils/activity-logger-helper";

import {
  type CreateTagDTO,
  type GetTagsDTO,
  type UpdateTagDTO,
  createTagSchema,
  getTagsSchema,
  updateTagSchema,
} from "../types";

export const isTagExistByID = async (id: string): Promise<boolean> => {
  const isExist = await prisma.tag.findUnique({ where: { id } });

  return Boolean(isExist);
};

export const getTags = async (params: GetTagsDTO) => {
  const result = await getTagsSchema.safeParseAsync(params);

  if (!result.success) {
    const error = result.error.format()._errors?.join(";");
    throw new Error(error);
  }

  const where: Prisma.TagWhereInput = {};

  if (result.data.type) {
    where.type = result.data.type;
  }

  if (result.data.name) {
    where.OR = [
      {
        name: {
          contains: result.data.name.trim(),
        },
      },
    ];
  }

  const orderBy: Prisma.TagOrderByWithRelationInput = {};
  if (result.data.orderBy && result.data.order) {
    orderBy[result.data.orderBy] = result.data.order;
  }

  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      orderBy,
      where,
      include: {
        blogs: true,
        notes: true,

        _count: true,
      },
      take: result.data.pageSize,
      skip: getSkip(result.data.pageIndex, result.data.pageSize),
    }),
    prisma.tag.count({ where }),
  ]);

  return { tags, total };
};

export const getAllTags = async (type?: TagTypeEnum) => {
  const cond: Prisma.TagWhereInput = {
    type: {
      in: type ? [TagTypeEnum.ALL, type] : [TagTypeEnum.ALL],
    },
  };

  const tags = await prisma.tag.findMany({
    where: cond,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = tags.length;

  return { tags, total };
};

export const createTag = async (params: CreateTagDTO) => {
  if (await noPermission()) {
    throw ERROR_NO_PERMISSION;
  }

  const userId = await getCurrentUserId();
  
  try {
    const { name, slug, type, icon, iconDark } =
      await createTagSchema.parseAsync(params);

    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existingTag) {
      // 记录创建失败日志
      await logTagActivity(
        userId,
        "TAG_CREATE",
        "FAILED",
        existingTag.id,
        name,
        undefined,
        "标签名称或别名已存在"
      );
      throw new Error("Tag or slug name already exist!");
    }

    const newTag = await prisma.tag.create({
      data: { name, slug, type, icon, iconDark },
    });

    // 记录创建成功日志
    await logTagActivity(
      userId,
      "TAG_CREATE",
      "SUCCESS",
      newTag.id,
      name,
      {
        action: "create",
        newValue: { name, slug, type, icon, iconDark },
      }
    );
  } catch (error) {
    // 记录其他创建失败情况
    await logTagActivity(
      userId,
      "TAG_CREATE",
      "FAILED",
      "unknown",
      params.name,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

export const deleteTagByID = async (id: string) => {
  if (await noPermission()) {
    throw ERROR_NO_PERMISSION;
  }

  const userId = await getCurrentUserId();

  try {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      await logTagActivity(
        userId,
        "TAG_DELETE",
        "FAILED",
        id,
        undefined,
        undefined,
        "标签不存在"
      );
      throw new Error("Tag not exist!");
    }

    await prisma.tag.delete({
      where: {
        id,
      },
    });

    // 记录删除成功日志
    await logTagActivity(
      userId,
      "TAG_DELETE",
      "SUCCESS",
      id,
      tag.name,
      {
        action: "delete",
        previousValue: { name: tag.name, slug: tag.slug, type: tag.type },
      }
    );
  } catch (error) {
    // 记录删除失败日志
    await logTagActivity(
      userId,
      "TAG_DELETE",
      "FAILED",
      id,
      undefined,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

export const updateTag = async (params: UpdateTagDTO) => {
  if (await noPermission()) {
    throw ERROR_NO_PERMISSION;
  }

  const userId = await getCurrentUserId();

  try {
    const { id, ...data } = await updateTagSchema.parseAsync(params);

    // 获取更新前的标签信息
    const existingTag = await prisma.tag.findUnique({ where: { id } });
    if (!existingTag) {
      await logTagActivity(
        userId,
        "TAG_UPDATE",
        "FAILED",
        id,
        undefined,
        undefined,
        "标签不存在"
      );
      throw new Error("Tag not exist!");
    }

    const updatedTag = await prisma.tag.update({
      data,
      where: {
        id,
      },
    });

    // 分析变更内容
    const changes: string[] = [];
    if (data.name && data.name !== existingTag.name) changes.push("名称");
    if (data.slug && data.slug !== existingTag.slug) changes.push("别名");
    if (data.type && data.type !== existingTag.type) changes.push("类型");
    if (data.icon && data.icon !== existingTag.icon) changes.push("图标");
    if (data.iconDark && data.iconDark !== existingTag.iconDark) changes.push("深色图标");

    // 记录更新成功日志
    await logTagActivity(
      userId,
      "TAG_UPDATE",
      "SUCCESS",
      id,
      updatedTag.name,
      {
        action: "update",
        previousValue: {
          name: existingTag.name,
          slug: existingTag.slug,
          type: existingTag.type,
          icon: existingTag.icon,
          iconDark: existingTag.iconDark,
        },
        newValue: data,
        changes,
      }
    );
  } catch (error) {
    // 记录更新失败日志
    await logTagActivity(
      userId,
      "TAG_UPDATE",
      "FAILED",
      params.id,
      undefined,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

export const getTagByID = async (id: string) => {
  const tag = await prisma.tag.findUnique({ where: { id } });
  return { tag };
};
