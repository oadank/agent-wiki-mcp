# agents-to-im 项目进度

## 项目信息
- **路径**：`/opt/.agents-to-im-claude`（主）、`/opt/.agents-to-im-codex`、`/usr/bin/agents-to-im`
- **描述**：飞书桥接软件（Claude + Codex 两个实例 + 全局二进制程序）
- **状态**：✅ active

## 进度记录

| 日期 | 任务 | AI | 状态 | 备注 |
|------|------|-----|------|------|
| 2026-05-09 | 首次注册项目 | Codex | ✅ | 三个路径关联，project tracking 功能测试 |
| 2026-05-09 15:05 | Claude | 项目注册完成 | ✅ | 关联三个路径：Claude实例、Codex实例、全局二进制 |
| 2026-05-23 09:29 | Claude | 为 agents-to-im 添加 OpenHuman runtime 支持 | 🚧 | 方案E：修改 agents-to-im 添加 openhuman runtime，保留飞书交互体验（标签确认、流式输出、互动卡片） |
| 2026-05-23 10:51 | Claude | 为 agents-to-im 添加 OpenHuman runtime 支持 | ✅ | 已推送：RuntimeName 添加 openhuman、RUNTIME_CAPABILITIES 配置、OpenHumanProvider/Driver、getProvider/getDriver 分支 |
| 2026-05-23 10:53 | Claude | 创建 agents-to-im-openhuman 飞书桥接服务 | ✅ | 创建了 systemd 服务，飞书 App 已配置（cli_a9313c8bbc799bb5），服务运行中 |
| 2026-05-25 | Claude | 修复消息撤回导致上下文丢失问题 | ✅ | - 添加 im.message.recalled_v1 事件处理器
- 清理撤回消息的 preview artifacts 和 lastIncomingMessageId
- 捕获 "message withdrawn" 错误，fallback 到创建新消息
- 防止 session lost 导致注入错误历史
- 推送到 oadank/agents-to-im (commit e5bce2a) |
