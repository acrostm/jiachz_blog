#!/bin/bash

set -euo pipefail

# 标记开始
echo "Starting Next.js build and notify system..."

# 检查环境是否为 Vercel
IS_VERCEL="${VERCEL:-false}"

if [ "$IS_VERCEL" != "1" ] && [ "$IS_VERCEL" != "true" ]; then
  echo "Not running on Vercel, performing additional steps..."
  echo "Update from github repo..."
  git pull
  echo "Install dependencies with pnpm..."
  pnpm install
fi

echo "Generating Prisma Client..."
pnpm exec prisma generate

if [ "$VERCEL_ENV" = "production" ]; then
  echo "Applying production database migrations..."
  pnpm exec prisma migrate deploy
elif [ "$RUN_PRISMA_MIGRATE_ON_PREVIEW" = "true" ]; then
  echo "Applying preview database migrations..."
  pnpm exec prisma migrate deploy
else
  echo "Skipping database migrations for Vercel environment: ${VERCEL_ENV:-local}"
fi

echo "Building Next.js project..."
set +e
pnpm exec next build
BUILD_STATUS=$?
set -e

# 获取当前时间
CURRENT_TIME=$(date +'%Y-%m-%d %H:%M:%S')

# 在 Vercel 环境中，curl -s http://ip.sb 可能会超时或被拦截，我们尝试获取一个 IP
SERVER_IP="Vercel Cloud"
if [ "$IS_VERCEL" != "1" ] && [ "$IS_VERCEL" != "true" ]; then
  SERVER_IP=$(curl -s --connect-timeout 5 http://ip.sb || echo "Unknown Local")
fi

# 根据构建结果发送通知
if [ $BUILD_STATUS -eq 0 ]; then
  echo "Build succeeded, sending success notification..."
  # 即使通知失败，也不应该导致整个构建标记为失败（如果构建本身是成功的）
  node scripts/send-build-notification.mjs "success" "$CURRENT_TIME" "$SERVER_IP" || echo "Warning: Success notification failed to send."
else
  echo "Build failed, sending failure notification..."
  # 如果构建已经失败，我们尝试发送失败通知
  node scripts/send-build-notification.mjs "failed" "$CURRENT_TIME" "$SERVER_IP" || echo "Warning: Failure notification failed to send."
fi

# 返回构建状态
exit $BUILD_STATUS
