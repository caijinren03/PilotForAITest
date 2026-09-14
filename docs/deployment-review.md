# 部署修复与验证

## 修复内容

- macOS 两个 .command 统一进入 scripts/deploy.mjs；新增 Windows start.bat。
- 检查 Node >=24、内置 SQLite、端口；npm ci 使用 package-lock.json 安装依赖，随后类型检查、构建到 dist、启动生产服务。
- 保留 server-runtime.mjs 兼容入口，移除重复实现及 runtime-dist 依赖。
- 去除个人 Node 路径；默认仅监听本机。
- 安装、构建和启动失败显示原因并写入 logs/deploy.log；双击启动失败保留窗口。
- Windows 密钥使用 DPAPI CurrentUser 加密，macOS 保留钥匙串；密钥文件和日志不提交。
- pnpm 的 core-js 构建许可占位值改为 false；文档统一采用 npm。

## 验证

在 /tmp/testpilot-clean-deploy-review 无 node_modules/dist 的独立目录执行部署，端口 3345：

- npm ci 完成（58 个包）。
- TypeScript 校验及 Vite 生产构建通过。
- 首页、首页 JS/CSS 资源、/api/bootstrap 和 SQLite 初始化通过。
- 已占用的 3344 端口会提示 EADDRINUSE 并退出，未影响原服务。
- zsh 与 Node 脚本语法检查、git diff --check 通过。
- 测试服务已停止。

## 限制

Windows 批处理及 DPAPI 已实现并做代码审查，当前环境无法进行 Windows 真机执行验证；发布前需在 Windows Node 24 环境完成首次启动和密钥保存/读取验证。
macOS 钥匙串未写入真实密钥，本次未做密钥往返测试。
生产构建仍存在前端包体积警告，不影响构建和访问。
每次一键启动都会安装依赖并重建，需要网络；已有构建可用 npm start 离线启动。
