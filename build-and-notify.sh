#!/bin/bash

# 标记开始
echo "Starting Next.js build and notify system..."

# 运行构建命令并捕获退出状态
next build
BUILD_STATUS=$?

# 获取当前时间和服务器IP
CURRENT_TIME=$(date +'%Y-%m-%d %H:%M:%S')
SERVER_IP=$(curl -s http://ip.sb)

# 根据构建结果发送通知
if [ $BUILD_STATUS -eq 0 ]; then
    echo "Build succeeded, sending success notification..."
    node scripts/send-build-notification.mjs "success" "$CURRENT_TIME" "$SERVER_IP"
else
    echo "Build failed, sending failure notification..."
    node scripts/send-build-notification.mjs "failed" "$CURRENT_TIME" "$SERVER_IP"
fi

# 返回构建状态
exit $BUILD_STATUS