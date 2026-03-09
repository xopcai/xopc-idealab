#!/bin/bash
# xopc-idealab PWA 部署脚本

set -e

echo "🚀 开始部署 PWA..."

# 1. 构建
echo "1️⃣ 构建 PWA..."
cd pwa
bun run build
cd ..

# 2. 同步到服务器
echo "2️⃣ 同步到服务器..."
scp -r pwa/dist/* root@idea.xopc.ai:/var/www/idea.xopc.ai/pwa/

# 3. 设置权限
echo "3️⃣ 设置权限..."
ssh root@idea.xopc.ai "chown -R www-data:www-data /var/www/idea.xopc.ai/pwa/"

# 4. 验证
echo "4️⃣ 验证部署..."
curl -s https://idea.xopc.ai/pwa/ | head -5

echo "✅ PWA 部署完成！"
echo "访问：https://idea.xopc.ai/pwa"
