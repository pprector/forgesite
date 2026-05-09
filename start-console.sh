#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/apps/console"
ENV_FILE="$APP_DIR/.env.local"
ENV_EXAMPLE="$APP_DIR/.env.local.example"

if [[ ! -d "$APP_DIR" ]]; then
  echo "[start-console] 未找到 console 目录: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

echo "[start-console] 工作目录: $APP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$ENV_EXAMPLE" ]]; then
    echo "[start-console] 未找到 .env.local，正在从 .env.local.example 复制"
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "[start-console] 已创建 .env.local，请按需检查其中的 Stack Auth 配置"
  else
    echo "[start-console] 缺少 .env.local，且未找到 .env.local.example" >&2
    exit 1
  fi
fi

if [[ ! -d node_modules ]]; then
  echo "[start-console] 未检测到 node_modules，开始安装依赖"
  npm install
else
  echo "[start-console] 已检测到 node_modules，跳过依赖安装"
fi

export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
echo "[start-console] 使用 DATABASE_URL=$DATABASE_URL"

echo "[start-console] 同步 Prisma schema 到本地数据库"
npx prisma db push

echo "[start-console] 启动 Next.js 开发服务器"
exec npm run dev
