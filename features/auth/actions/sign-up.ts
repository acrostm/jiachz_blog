"use server";

import { PATHS } from "@/constants";
import { type SignupDTO } from "@/features/auth";
import { createUser } from "@/features/user";
import { signIn } from "@/lib/auth";

export const signUpWithCredentials = async (params: SignupDTO) => {
  await createUser(params);
  const url = await signIn("credentials", {
    redirect: false,
    redirectTo: PATHS.ADMIN_HOME,
    email: params.email,
    password: params.password,
  });

  if (typeof url === "string" && url.includes("error")) {
    throw new Error("注册成功，但登录失败");
  }

  return url as string;
};
