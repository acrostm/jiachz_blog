"use client";

import { signIn } from "next-auth/react";

import { PATHS } from "@/constants";

export const signInWithGithub = async () => {
  await signIn("github", {
    callbackUrl: PATHS.ADMIN_HOME,
  });
};

export const signInWithGoogle = async () => {
  await signIn("google", {
    callbackUrl: PATHS.ADMIN_HOME,
  });
};
