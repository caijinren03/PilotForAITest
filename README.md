# TestPilot 个人测试工作台

面向个人测试工程师的本地工作台，使用黄色作为主题色，数据保存在本机 SQLite。

## 一键部署与启动（macOS / Windows）

先安装 **Node.js 24 LTS 或更高版本**（包含 npm）：<https://nodejs.org/>。
将项目下载并完整解压到当前用户可写的文件夹，不要直接在压缩包中运行。

- macOS：双击 `start.command`（`启动 TestPilot.command` 为同一入口）。
- Windows：双击 `start.bat`。
- 终端通用入口：在项目目录执行 `npm run deploy`。

启动程序会检查环境和端口、使用 `npm ci` 安装锁定依赖、校验并构建到 `dist`、启动生产服务并打开浏览器。每次启动均校验安装与构建，需要能够访问 npm 软件源。保留终端窗口，关闭窗口或按 Ctrl+C 停止服务。

网站地址：<http://127.0.0.1:3344>，默认仅本机可访问。

故障处理：

- 未找到 Node：安装后重新打开终端或启动脚本。
- Mac 提示无执行权限：终端执行 `chmod +x start.command`，再运行 `./start.command`。
- 下载依赖失败：检查网络或 npm 软件源；详细错误见 `logs/deploy.log`。
- 3344 端口占用：关闭原服务，或设置 `PORT` 环境变量后启动。
- 已安装依赖并构建后，可用 `npm start` 直接启动，无需再次联网安装。

数据位于 `data/testpilot.sqlite`，更新代码时请保留 `data` 文件夹。

首次进入时，如果检测到旧版浏览器数据，页面会询问是否备份并迁移到 SQLite。迁移文件保存在 `data/backups`，迁移过程具有幂等保护。

<img width="1280" height="1189" alt="image" src="https://github.com/user-attachments/assets/7d87a6ff-5947-4b2f-ad6a-7b3bf7bc30c2" />
## 主要功能

- 首页指标、快捷单任务与组合任务
- 项目 → 模块 → 子模块三级配置
- 用例树、分页搜索、批量选择、XLSX/CSV/JSON 导出
- Bug、日志、SQL 独立任务表单、列表、详情与审核入库
- 可在线执行的回归清单
- 统一测试报告与 Markdown/PDF 下载
- 可编辑、版本化、带引用保护的知识库
- 父子任务结构的自定义全链路
- AI 测试助手：自动识别主任务与辅助任务，按固定顺序执行 7 类标准入口
- 执行记录：保存原始输入、路由、逐步轨迹、证据、缺项和人工复核结论
- 工作台编排：配置触发词、必填项、知识映射与工作流，发布时自动递增版本
- 案例验证：使用固定 walkthrough 回归路由顺序与安全规则
- OpenAI、通义千问、DeepSeek 和自定义兼容模型配置
<img width="1280" height="871" alt="image" src="https://github.com/user-attachments/assets/e07fc911-5134-46a5-8eeb-66a79d5385e8" />

AI 测试助手遵循以下边界：证据不足时明确提示，不编造知识标题或 Bug 编号，AI 不批准上线，P0/P1 与 Prompt 测试结果必须人工复核。

API Key 在 macOS 使用钥匙串，在 Windows 使用当前用户的 DPAPI 加密保存至 `data/keys`。Windows 加密文件不能直接换用户或换电脑解密，迁移后需重新配置 Key。SQLite 仅记录脱敏状态。
<img width="1280" height="897" alt="image" src="https://github.com/user-attachments/assets/01a0f110-1f3d-4a82-9c07-32dd98d1d676" />


## 开发校验

```bash
npm run check
npm run build
```

生产构建后可运行 `npm start`。服务端与前端统一使用 `3344` 端口。



