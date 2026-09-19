#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

PORT="${DEPLOY_RUN_PORT:-5000}"
export PORT

# 云端平台健康检查要求监听 0.0.0.0；本地直连 npm start 不受影响
HOST="${HOST:-0.0.0.0}"
export HOST

# 云端运行环境为只读文件系统，仅 /tmp 可写；本地不设 DATA_DIR 时仍用项目根 data/
DATA_DIR="${DATA_DIR:-/tmp/testpilot-data}"
export DATA_DIR

echo "Starting HTTP service on port ${PORT} for deploy..."
exec node server.mjs --production
