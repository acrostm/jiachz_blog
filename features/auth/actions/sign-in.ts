"use server";

import { PATHS } from "@/constants";
import { signIn } from "@/lib/auth";

export const signInWithGithub = async () => {
  await signIn("github", {
    redirectTo: PATHS.ADMIN_HOME,
  });
};

export const signInWithGoogle = async () => {
  await signIn("google", {
    redirectTo: PATHS.ADMIN_HOME,
  });
};

export const signInWithCredentials = async (params: {
  email: string;
  password: string;
}) => {
  const url = await signIn("credentials", {
    redirect: false,
    redirectTo: PATHS.ADMIN_HOME,
    ...params,
  });

  if (typeof url === "string" && url.includes("error")) {
    throw new Error("邮箱或密码错误");
  }

  return url as string;
};
