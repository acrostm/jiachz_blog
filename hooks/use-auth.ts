"use client";

import { useSession } from "next-auth/react";

export const useAuth = () => {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isAuthenticated: !!session?.user,
    isVerified: !!(
      session?.user &&
      "emailVerified" in session.user &&
      session.user.emailVerified
    ),
    isLoading: status === "loading",
    status,
  };
};
