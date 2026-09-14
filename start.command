#!/bin/zsh
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js 24 LTS（https://nodejs.org），然后重新双击启动。"
  read -k 1 "?按任意键关闭..."
  exit 1
fi
node scripts/deploy.mjs
result=$?
if (( result != 0 )); then
  read -k 1 "?启动失败，按任意键关闭..."
fi
exit $result
