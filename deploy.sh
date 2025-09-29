#!/bin/bash

# Smart Mermaid 部署脚本
echo "🚀 开始部署 Smart Mermaid..."

# 1. 构建生产版本
echo "📦 构建生产版本..."
npm run build

# 2. 复制静态文件到 standalone 目录（修复SSR静态文件问题）
echo "📂 复制静态文件..."
cp -r .next/static .next/standalone/.next/static

# 3. 停止现有服务
echo "🛑 停止现有服务..."
fuser -k 3002/tcp || true
sleep 2

# 4. 启动新服务（使用正确的standalone模式）
echo "▶️  启动生产服务器..."
NODE_ENV=production PORT=3002 node .next/standalone/server.js &

# 5. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 6. 健康检查
echo "🔍 执行健康检查..."
if curl -f -s http://localhost:3002 > /dev/null; then
    # 7. 检查静态资源
    echo "🔍 检查静态资源..."
    if curl -f -s -I https://mermaid.chyax.site/_next/static/chunks/webpack-*.js > /dev/null; then
        echo "✅ 部署成功！所有资源正常加载"
        echo "🌐 网站地址: https://mermaid.chyax.site"
        echo "🔧 SSR hydration 问题已修复"
    else
        echo "⚠️  服务启动但静态资源可能有问题"
        echo "🌐 网站地址: https://mermaid.chyax.site"
    fi
else
    echo "❌ 部署失败，请检查日志"
    exit 1
fi

echo "🎉 Smart Mermaid 部署完成！"