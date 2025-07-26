#!/bin/bash

# 标记开始
echo "Starting Next.js build and notify system..."

# 运行构建命令并捕获退出状态
next build
BUILD_STATUS=$?

# 获取当前时间和服务器IP
CURRENT_TIME=$(date +'%Y-%m-%d %H:%M:%S')
SERVER_IP=$(curl -s http://ip.sb)

# 使用 Node.js 调用新的通知模块
send_build_notification() {
    local success=$1
    local time=$2
    local server_ip=$3
    
    node -e "
    const { notifyBuildSuccess, notifyBuildFailed } = require('./lib/notification');
    
    (async () => {
        try {
            if ('$success' === 'true') {
                await notifyBuildSuccess('$time', '$server_ip');
                console.log('Success notification sent via new module!');
            } else {
                await notifyBuildFailed('$time', '$server_ip');
                console.log('Failure notification sent via new module!');
            }
        } catch (error) {
            console.error('Failed to send notification via new module, falling back to original method');
            
            // 原始通知函数作为备用方案
            const status = '$success' === 'true' ? '✅' : '❌';
            const title = '$success' === 'true' ? '🚀 [Next Build Success] 🎉' : '🚨 [Next Build Failed] ❌';
            const body = '$success' === 'true' ? 
                '🎉 **Build Status:** SUCCESS ✅\\\n\\\n🕒 **Build Time:** $time\\\n\\\n🌐 **Server IP:** $server_ip\\\n\\\n✨ Congratulations! Your Next.js project has been successfully built! 🎊' :
                '⚠️ **Build Status:** FAILED ❌\\\n\\\n🕒 **Failure Time:** $time\\\n\\\n🌐 **Server IP:** $server_ip\\\n\\\n💥 Please check the logs and fix the issues. Good luck! 💪';
            const sound = '$success' === 'true' ? 'shake.caf' : 'ladder.caf';
            
            const fetch = require('node:https').request;
            const data = JSON.stringify({
                key: status,
                body: body,
                title: title,
                sound: sound,
                group: 'Blog',
                category: '服务监控',
                icon: 'https://r2.jiachz.com/jiachz-light.svg'
            });
            
            const options = {
                hostname: 'bark.jiachz.com',
                port: 443,
                path: '/9fZrbZk3hu2eLs4B24yL2M/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': data.length
                }
            };
            
            const req = fetch(options, (res) => {
                console.log('Fallback notification sent!');
            });
            
            req.on('error', (err) => {
                console.error('Fallback notification failed:', err);
            });
            
            req.write(data);
            req.end();
        }
    })();
    "
}

# 根据构建结果发送通知
if [ $BUILD_STATUS -eq 0 ]; then
    echo "Build succeeded, sending success notification..."
    send_build_notification "true" "$CURRENT_TIME" "$SERVER_IP"
else
    echo "Build failed, sending failure notification..."
    send_build_notification "false" "$CURRENT_TIME" "$SERVER_IP"
fi