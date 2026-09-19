#!/bin/zsh
# TestPilot 停止
if pkill -f "node server.mjs --production"; then
  echo "🛑 TestPilot 已停止"
else
  echo "TestPilot 未在运行"
fi
sleep 3
