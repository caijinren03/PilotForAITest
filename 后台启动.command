#!/bin/zsh
# TestPilot 后台启动（窗口可关闭，服务保持运行）
cd "${0:A:h}"
if lsof -i :3344 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ TestPilot 已在运行：http://127.0.0.1:3344"
  sleep 3
  exit 0
fi
if [ ! -f dist/index.html ]; then
  echo "❌ 尚未构建，请先双击 start.command 完成首次部署"
  sleep 5
  exit 1
fi
mkdir -p logs
nohup /opt/homebrew/bin/node server.mjs --production > logs/server.out 2>&1 &
sleep 3
if lsof -i :3344 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ TestPilot 已启动：http://127.0.0.1:3344"
  echo "（本窗口可以关闭，服务在后台运行）"
else
  echo "❌ 启动失败，详见 logs/server.out"
fi
sleep 3
