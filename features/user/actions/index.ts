"use server";

import { hashSync } from "bcryptjs";

import { ADMIN_EMAILS, ERROR_NO_PERMISSION } from "@/constants";
import { type SignupDTO, signupSchema } from "@/features/auth";
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
  await prisma.user.create({
    data: {
      name: result.data.name,
      password: hashedPassword,
      email: result.data.email,
    },
  });
};

export const noPermission = async () => {
  const session = await auth();

  // 没有登录用户，返回true，无权限
  if (!session?.user?.email) {
    return true;
  }

  // 如果是admin用户，返回false，有权限
  if (ADMIN_EMAILS?.length && ADMIN_EMAILS.includes(session.user.email)) {
    return false;
  }

  // 检查用户是否已验证邮箱
  if (
    session.user &&
    "emailVerified" in session.user &&
    session.user.emailVerified
  ) {
    return false; // 已验证用户有权限
  }

  // 其他情况返回true，无权限
  return true;
};

export const deleteUserByID = async (id: string) => {
  if (await noPermission()) {
    throw ERROR_NO_PERMISSION;
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error("用户不存在");
  }
  await prisma.user.delete({ where: { id } });
};
