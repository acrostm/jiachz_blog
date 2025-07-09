import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    emailVerified?: Date | null;
  }

  interface Session {
    user: User & {
      id: string;
      emailVerified?: Date | null;
    };
  }
}
