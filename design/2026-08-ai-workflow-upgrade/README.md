# TestPilot AI 测试助手升级设计交付物

本目录只包含需求与独立原型，不修改当前 TestPilot 正式功能或数据库。设计依据为飞书《6.5 AI测试助手与工作流整合｜实操教程》（revision 54）：

<https://kxfgae3nvd.feishu.cn/wiki/ZMRywdQihicv8fkCJDmc6iWEnZe>

## 文件

- `requirements.md`：完整升级需求、流程、数据设计、验收标准与待确认项。
- `prototype/index.html`：可点击原型，包含 AI 测试助手、执行记录、工作台编排、案例验证四个页面。
- `prototype/preview-*.png`：原型页面预览图。

## 本地预览

在 `prototype` 目录启动任意静态文件服务后打开 `index.html`。当前评审地址为：

<http://127.0.0.1:3355/>

原型交互：

1. 在“AI 测试助手”点击“识别并预检”；
2. 查看多入口命中、执行顺序和缺失字段；
3. 点击“按当前信息创建有限任务”进入执行记录；
4. 进入“工作台编排”查看入口与资产绑定；
5. 进入“案例验证”运行断言。

原型仅展示交互方向，不连接模型、不保存数据、不修改正式工作台配置。
