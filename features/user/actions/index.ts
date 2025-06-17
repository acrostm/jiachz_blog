"use server";

import { hashSync } from "bcryptjs";

import { ADMIN_EMAILS } from "@/constants";
import {
  type SignupDTO,
  type UpdatePasswordDTO,
  type UpdateNameDTO,
  signupSchema,
  updatePasswordSchema,
  updateNameSchema,
} from "@/features/auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const createUser = async (params: SignupDTO) => {
  const result = await signupSchema.safeParseAsync(params);

  if (!result.success) {
    const error = result.error.format()._errors?.join(";");
    // TODO: 记录日志
    throw new Error(error);
  }

  const isExist = await prisma.user.findUnique({
    where: {
      email: result.data.email,
    },
  });

  if (isExist) {
    throw new Error("当前邮箱已注册！");
  }

  const hashedPassword = hashSync(result.data.password);
  const user = await prisma.user.create({
    data: {
      name: result.data.name,
      password: hashedPassword,
      email: result.data.email,
      image: ImageAssets.defaultAvatar,
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      provider: "credentials",
      type: "credentials",
      providerAccountId: user.email!,
    },
  });

  return user;
};

export const noPermission = async () => {
  const session = await auth();

  // 没有邮箱或者未配置admin邮箱，返回true，无权限
  if (!session?.user?.email || !ADMIN_EMAILS?.length) {
    return true;
  } else {
    // 如果当前用户邮箱存在admin邮箱中，返回false，说明有权限
    return !ADMIN_EMAILS.includes(session.user.email);
  }
};

export const updateUserPassword = async (
  userId: string,
  params: UpdatePasswordDTO,
) => {
  const result = await updatePasswordSchema.safeParseAsync(params);
  if (!result.success) {
    const error = result.error.format()._errors?.join(";");
    throw new Error(error);
  }

  const hashedPassword = hashSync(result.data.password);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

export const updateUserName = async (
  userId: string,
  params: UpdateNameDTO,
) => {
  const result = await updateNameSchema.safeParseAsync(params);
  if (!result.success) {
    const error = result.error.format()._errors?.join(";");
    throw new Error(error);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: result.data.name },
  });
};

export const getUserAccounts = async (userId: string) => {
  return prisma.account.findMany({
    where: { userId },
    select: { provider: true, providerAccountId: true },
  });
};

export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return { users, total: users.length };
};
