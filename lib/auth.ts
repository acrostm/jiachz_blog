import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { NODE_ENV } from "@/config";

import { PATHS } from "@/constants";
import { activityLogger } from "@/lib/activity-logger";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signOut, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // 解决这个错误：Error: PrismaClient is not configured to run in Vercel Edge Functions or Edge Middleware.
  // 参考：https://github.com/prisma/prisma/issues/21310#issuecomment-1840428931
  session: {
    strategy: "jwt",
    maxAge: 10 * 60 * 60, // 10 hours in seconds
  },
  trustHost: true,
  providers: [
    // 允许多个account关联同一个user（email相同）
    GithubProvider({ allowDangerousEmailAccountLinking: true }),
    GoogleProvider({ allowDangerousEmailAccountLinking: true }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "邮箱", type: "text", placeholder: "your@email.com" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("请输入邮箱和密码");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.password) {
          throw new Error("用户不存在或未设置密码");
        }
        const plainPassword = credentials.password as string;
        const hashedPassword = String(user.password);
        const isValid = await bcrypt.compare(plainPassword, hashedPassword);
        if (!isValid) {
          throw new Error("密码错误");
        }
        // 检查 account 表
        const account = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: "credentials",
          },
        });
        if (!account) {
          await prisma.account.create({
            data: {
              userId: user.id,
              provider: "credentials",
              providerAccountId: user.email!,
              type: "credentials",
            },
          });
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: PATHS.AUTH_SIGN_IN,
  },
  debug: NODE_ENV === "development",
  callbacks: {
    async session({ session, token }) {
      if (session.user && token?.sub) {
        session.user.id = token.sub;

        // Fetch user data from database to get emailVerified
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { emailVerified: true },
        });

        if (user) {
          session.user.emailVerified = user.emailVerified;
        }
      }
      return session;
    },
    authorized({ request, auth }) {
      // 将来用作 Next.js middleware，如果是访问后台页面，校验是否登录
      if (request.nextUrl.pathname.startsWith(PATHS.ADMIN_HOME)) {
        return !!auth?.user;
      }

      // 其它路径直接放行
      return true;
    },
    async signIn({ user, account }) {
      if (user?.id) {
        // Update basic user login time (keeping existing functionality)
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Determine login method
        let loginMethod:
          | "CREDENTIALS"
          | "OAUTH_GITHUB"
          | "OAUTH_GOOGLE"
          | "OTP" = "CREDENTIALS";
        if (account?.provider === "github") {
          loginMethod = "OAUTH_GITHUB";
        } else if (account?.provider === "google") {
          loginMethod = "OAUTH_GOOGLE";
        }

        // Track the login using new activity logger
        // Note: this will use "unknown" for IP since we don't have access to headers here
        // The comprehensive tracking will be done at the API route level
        try {
          await activityLogger.trackLogin({
            userId: user.id,
            loginMethod,
            loginStatus: "SUCCESS",
            sessionId: account?.providerAccountId,
          });
        } catch {
          // Don't break the login flow
        }
      }
      return true;
    },
  },
});
