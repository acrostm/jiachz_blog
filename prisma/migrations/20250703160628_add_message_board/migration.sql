-- CreateTable
CREATE TABLE "MessageBoard" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLogin" BOOLEAN NOT NULL,
    "userId" TEXT,

    CONSTRAINT "MessageBoard_pkey" PRIMARY KEY ("id")
);
